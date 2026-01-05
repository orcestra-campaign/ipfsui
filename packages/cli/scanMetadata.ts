import { clearTimeout, setTimeout } from "node:timers";
import { unixfs } from "@helia/unixfs";
import { CID } from "multiformats";

import * as path from "node:path";
import * as fs from "node:fs/promises";

import process from "node:process";
import type { UnixFSEntry } from "ipfs-unixfs-exporter";
import { getStore, stacFromStore, srcinfoToStacId, DeltaCodec, type StacItem } from "@orcestra/utils";

import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

import pLimit from "p-limit";

import { registry } from "zarrita";

import { Monitor, ActiveMonitor } from "./scanMonitor";
import configureHelia from "./configureHelia";

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

const crawlLimit = pLimit(30);

async function collectDatasets(
  cid: CID,
  path: string = "",
  blacklist: string[] = [],
  monitor: Monitor,
  cache: ItemCIDCache,
): Promise<Array<CIDPath>> {
  const cachedItems = await cache.getItem(cid);
  if (cachedItems !== null) {
    return cachedItems;
  }
  monitor.enterPath(path);
  if (blacklist.includes(path)) {
    console.log("skipping path", path);
    monitor.leavePath(path);
    return [];
  }
  try {
  const res = await crawlLimit(Array.fromAsync, ipfs_fs.ls(cid));
  if (isDataset(res)) {
    console.log("collected", path);
    monitor.leavePath(path);
    return [{ cid: cid.toV1(), path }];
  } else {
    const out = (await Promise.all(
      res.filter((e) => e.type === "directory").map((e) =>
        collectDatasets(e.cid, path + "/" + e.name, blacklist, monitor, cache)
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
    monitor.leavePath(path);
    await cache.putItem(cid, out);
    return out;
  }
  } catch (e) {
    console.error(e);
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

const monitor = new ActiveMonitor();

const datasetLocations = await collectDatasets(
  root_cid,
  "",
  blacklist,
  monitor,
  itemCIDCache,
);

console.log("all datasets collected, extracting metadata");


const stacItems = await Promise.all(
  datasetLocations.map(async ({ cid, path }) => {
    const src = "ipfs://" + root_cid.toString() + path;
    const srcinfo = {
      src,
      item_cid: cid,
      root_cid,
    };
    const stacId = srcinfoToStacId(srcinfo);
    const cachedItem = await stacCache.getItem(stacId);
    if (cachedItem !== null) {
      return cachedItem;
    }
    const store = getStore("ipfs://" + cid.toString(), { helia });
    const timeout = setTimeout(() => {
      console.log(cid.toString(), "takes longer than expected");
    }, 50000);

    const stacItem = crawlLimit(stacFromStore, store, srcinfo);
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

helia.stop();
process.exit(0);
