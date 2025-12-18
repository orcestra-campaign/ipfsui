//import setupHelia from "../lib/setupHelia.ts";
import { clearTimeout, setTimeout } from "node:timers";
import { unixfs } from "@helia/unixfs";
import { createHelia } from "helia";
import { CID } from "multiformats";

import * as path from "node:path";
import * as fs from "node:fs/promises";

import { createHeliaHTTP } from "@helia/http";
import { trustlessGateway } from "@helia/block-brokers";
import { httpGatewayRouting } from "@helia/routers";

import { dns } from "@multiformats/dns";
import { dnsJsonOverHttps } from "@multiformats/dns/resolvers";

import { FsDatastore } from "datastore-fs";
import { FsBlockstore } from "blockstore-fs";
import process from "node:process";
import type { UnixFSEntry } from "ipfs-unixfs-exporter";
import { getStore, stacFromStore, readDataset, extractLoose, parseMetadata, metadataToStacId, DeltaCodec, type StacItem } from "@orcestra/utils";

import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

import { registry } from "zarrita";

// @ts-expect-error DeltaCodec only handles numbers, but I didn't yet figure out how to check this properly
registry.set("delta", () => DeltaCodec);

function isDataset(directoryListing: Array<UnixFSEntry>) {
  for (const entry of directoryListing) {
    if (
      [".zgroup", "dataset_meta.yaml"].includes(entry.name) &&
      ["file", "raw", "identity"].includes(entry.type)
    ) {
      return true;
    }
  }
  return false;
}

interface CIDPath {
  cid: CID;
  path: string;
}

interface ItemCIDCache {
  getItem(root: CID): Promise<Array<CIDPath> | null>;
  putItem(root: CID, items: Array<CIDPath>): Promise<void>;
}

async function collectDatasets(
  cid: CID,
  path: string = "",
  blacklist: string[] = [],
): Promise<Array<CIDPath>> {
  if (blacklist.includes(path)) {
    console.log("skipping path", path);
    return [];
  }
  const res = await Array.fromAsync(ipfs_fs.ls(cid));
  if (isDataset(res)) {
    console.log("collected", path);
    return [{ cid: cid.toV1(), path }];
  } else {
    console.log("entering path", path);
    const out = (await Promise.all(
      res.filter((e) => e.type === "directory").map((e) =>
        collectDatasets(e.cid, path + "/" + e.name, blacklist)
      ),
    )).flat();
    /*
    const out = [];
    for (const e of res) {
      if (e.type === "directory") {
        out.push(...await collectDatasets(e.cid, path + "/" + e.name));
      }
    }
    */
    console.log("finished path", path);
    return out;
  }
}

async function collectDatasetsWithCache(
  cid: CID,
  path: string = "",
  blacklist: string[] = [],
  cache: ItemCIDCache,
): Promise<Array<CIDPath>> {
  const cachedItems = await cache.getItem(cid);
  if (cachedItems !== null) {
    return cachedItems;
  }
  const items = await collectDatasets(cid, path, blacklist);
  await cache.putItem(cid, items);
  return items;
}

async function getGatewayFromFile(
  filename: string,
): Promise<string | undefined> {
  console.info("trying", filename);
  try {
    return (await fs.readFile(filename, {encoding: "utf-8"}))?.split("\n")[0]?.trim();
  } catch {
    return undefined;
  }
}

async function getLocalGatewayConfiguration(): Promise<string | undefined> {
  const IPFS_GATEWAY = process.env.IPFS_GATEWAY;
  if (IPFS_GATEWAY) {
    return IPFS_GATEWAY;
  }
  const IPFS_PATH = process.env.IPFS_PATH;
  if (IPFS_PATH) {
    const GATEWAY = await getGatewayFromFile(path.join(IPFS_PATH, "gateway"));
    if (GATEWAY) return GATEWAY;
  }
  const HOME = process.env.HOME;
  if (HOME) {
    const GATEWAY = await getGatewayFromFile(
      path.join(HOME, ".ipfs", "gateway"),
    );
    if (GATEWAY) return GATEWAY;
  }
  const CONFIG_HOME = process.env.XDG_CONFIG_HOME;
  if (CONFIG_HOME) {
    const GATEWAY = await getGatewayFromFile(
      path.join(CONFIG_HOME, "ipfs", "gateway"),
    );
    if (GATEWAY) return GATEWAY;
  }
  {
    const GATEWAY = await getGatewayFromFile(
      path.join("/etc", "ipfs", "gateway"),
    );
    if (GATEWAY) return GATEWAY;
  }
}

async function configureStandaloneHelia() {
  const datastore = new FsDatastore(".helia/datastore");
  const blockstore = new FsBlockstore(".helia/blockstore");

  const resolver = dns({
    resolvers: {
      ".": [
        dnsJsonOverHttps("https://cloudflare-dns.com/dns-query"),
        dnsJsonOverHttps("https://dns.google/resolve"),
      ],
    },
  });

  const helia = await createHelia({
    datastore,
    blockstore,
    dns: resolver,
    libp2p: { dns: resolver },
  });
  console.info("this node's peerId:", helia.libp2p.peerId.toString());
  return helia;
}

async function configureLocalHelia(gateway: string) {
  const helia = await createHeliaHTTP({
    blockBrokers: [
      trustlessGateway({ allowInsecure: true, allowLocal: true }),
    ],
    routers: [
      httpGatewayRouting({
        gateways: [gateway],
      }),
    ],
  });
  return helia;
}

async function configureHelia() {
  const gateway = await getLocalGatewayConfiguration();
  if (gateway) {
    console.log("using local IPFS gateway configuration:", gateway);
    return await configureLocalHelia(gateway);
  } else {
    console.log("using standalone IPFS implementation");
    return await configureStandaloneHelia();
  }
}

class NoItemCIDCache implements ItemCIDCache {
  getItem(_root: CID): Promise<Array<CIDPath> | null> {
    return Promise.resolve(null);
  }
  putItem(_root: CID, _items: Array<CIDPath>): Promise<void> {
    return Promise.resolve();
  }
}

class FileItemCIDCache implements ItemCIDCache {
  root: string;
  constructor(root: string) {
    this.root = root;
  }
  filename(root_cid: CID): string {
    return path.format({
      root: "/",
      dir: this.root,
      ext: ".cid_items.json",
      name: root_cid.toString(),
    });
  }
  async getItem(root: CID): Promise<Array<CIDPath> | null> {
    try {
      const content = await fs.readFile(this.filename(root), {encoding: "utf-8"});
      if (content !== undefined) {
        return JSON.parse(content).map(
          ({ cid, path }: { cid: string; path: string }) => {
            return {
              cid: CID.parse(cid),
              path,
            };
          },
        );
      }
    } catch {
      // continue if no cache item found
    }
    return null;
  }
  async putItem(root: CID, items: Array<CIDPath>): Promise<void> {
    await fs.mkdir(this.root, { recursive: true });
    return await fs.writeFile(
      this.filename(root),
      JSON.stringify(items.map(({ cid, path }: { cid: CID; path: string }) => {
        return {
          cid: cid.toString(),
          path,
        };
      })),
      {encoding: "utf-8"},
    );
  }
}

interface StacCache {
  getItem(id: string): Promise<StacItem | null>;
  putItem(item: StacItem): Promise<void>;
}

class NoCache implements StacCache {
  getItem(_id: string): Promise<StacItem | null> {
    return Promise.resolve(null);
  }
  putItem(_item: StacItem): Promise<void> {
    return Promise.resolve();
  }
}

class FileCache implements StacCache {
  root: string;
  constructor(root: string) {
    this.root = root;
  }
  filename(id: string): string {
    return path.format({
      root: "/",
      dir: this.root,
      ext: ".json",
      name: id,
    });
  }
  async getItem(id: string): Promise<StacItem | null> {
    try {
      const content = await fs.readFile(this.filename(id), {encoding: "utf-8"});
      if (content !== undefined) {
        return JSON.parse(content);
      }
    } catch {
      // continue if no cache item found
    }
    return null;
  }
  async putItem(item: StacItem): Promise<void> {
    await fs.mkdir(this.root, { recursive: true });
    return await fs.writeFile(
      this.filename(item.id),
      JSON.stringify(item),
      {encoding: "utf-8"},
    );
  }
}

const options = [
  { name: "help", alias: "h", type: Boolean, description: "show this help" },
  {
    name: "cid",
    type: String,
    typeLabel: "{underline CID}",
    description: "root CID to scan for datasets",
  },
  {
    name: "outfile",
    alias: "o",
    type: String,
    typeLabel: "{underline items.json}",
    description: "output file (containing stac items)",
  },
  {
    name: "cachedir",
    alias: "C",
    type: String,
    typeLabel: "{underline some/folder}",
    description: "cache directory",
  },
];

const sections = [
  {
    header: "dataset metadata scanner",
    content: "Scans for zarr datasets on IPFS.",
  },
  {
    header: "Options",
    optionList: options,
  },
];

const args = commandLineArgs(options);
if (args?.help) {
  const usage = commandLineUsage(sections);
  console.log(usage);
  process.exit(0);
}

if (args?.cid === undefined) {
  console.error("please specify a --cid");
  process.exit(-1);
}

const root_cid = CID.parse(args.cid);

const helia = await configureHelia();
const ipfs_fs = unixfs(helia);

const blacklist = [
  "/HALO/dropsondes/Level_1",
  "/HALO/dropsondes/Level_2",
];

let itemCIDCache: ItemCIDCache;
let stacCache: StacCache;
if (args?.cachedir) {
  itemCIDCache = new FileItemCIDCache(path.join(args.cachedir, "cidlist"));
  stacCache = new FileCache(path.join(args.cachedir, "items"));
} else {
  itemCIDCache = new NoItemCIDCache();
  stacCache = new NoCache();
}

const datasetLocations = await collectDatasetsWithCache(
  root_cid,
  "",
  blacklist,
  itemCIDCache,
);

console.log("all datasets collected, extracting metadata");

const stacItems = await Promise.all(
  datasetLocations.map(async ({ cid, path }) => {
    const src = "ipfs://" + root_cid.toString() + path;
    const baseMetadata = {
      src,
      item_cid: cid,
    };
    const stacId = metadataToStacId(baseMetadata);
    const cachedItem = await stacCache.getItem(stacId);
    if (cachedItem !== null) {
      return cachedItem;
    }
    const store = getStore("ipfs://" + cid.toString(), { helia });
    const timeout = setTimeout(() => {
      console.log(cid.toString(), "takes longer than expected");
    }, 50000);
    const srcinfo = {
      ...baseMetadata,
      root_cid,
    };

    let stacItem;
    for await (const item of stacFromStore(store, srcinfo)) {
      stacItem = item;
    }
    console.log(stacItem?.properties?.title);
    clearTimeout(timeout);
    if (stacItem !== undefined) {
      stacCache.putItem(stacItem);
    }
    return stacItem as StacItem;
  }),
);

if (args?.outfile !== undefined) {
  await fs.writeFile(args.outfile, JSON.stringify(stacItems), {encoding: "utf-8"});
}
process.exit(0);
