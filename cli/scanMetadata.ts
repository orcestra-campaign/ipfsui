//import setupHelia from "../lib/setupHelia.ts";
import { clearTimeout, setTimeout } from "node:timers";
import { unixfs } from "@helia/unixfs";
import { createHelia } from "helia";
import { CID } from "multiformats";

import * as path from "jsr:@std/path";

import { createHeliaHTTP } from "npm:@helia/http";
import { trustlessGateway } from "npm:@helia/block-brokers";
import { httpGatewayRouting } from "npm:@helia/routers";

import { dns } from "@multiformats/dns";
import { dnsJsonOverHttps } from "@multiformats/dns/resolvers";

import { FsDatastore } from "datastore-fs";
import { FsBlockstore } from "blockstore-fs";
import process from "node:process";
import type { UnixFSEntry } from "ipfs-unixfs-exporter";
import { getStore } from "../src/utils/store.ts";
import { readDataset } from "../src/utils/ds/index.ts";
import { extractLoose } from "../src/utils/dsAttrConvention.ts";
import parseMetadata from "../src/utils/parseMetadata.ts";

import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

import { registry } from "zarrita";
import { DeltaCodec } from "../src/utils/ds/codecs/delta.ts";
import { StacItem } from "../src/utils/stac.ts";

// @ts-expect-error DeltaCodec only handles numbers, but I didn't yet figure out how to check this properly
registry.set("delta", () => DeltaCodec);

function isDataset(directoryListing: Array<UnixFSEntry>) {
  for (const entry of directoryListing) {
    if (
      entry.name == ".zgroup" &&
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

async function collectDatasets(
  cid: CID,
  path: string = "",
  blacklist: string[] = [],
): Promise<Array<CIDPath>> {
  if (blacklist.includes(path)) {
    console.log("skipping path", path);
    return [];
  }
  const res = await Array.fromAsync(fs.ls(cid));
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

async function getGatewayFromFile(
  filename: string,
): Promise<string | undefined> {
  console.info("trying", filename);
  try {
    return (await Deno.readTextFile(filename))?.split("\n")[0]?.trim();
  } catch {
    return undefined;
  }
}

async function getLocalGatewayConfiguration(): Promise<string | undefined> {
  const IPFS_GATEWAY = Deno.env.get("IPFS_GATEWAY");
  if (IPFS_GATEWAY) {
    return IPFS_GATEWAY;
  }
  const IPFS_PATH = Deno.env.get("IPFS_PATH");
  if (IPFS_PATH) {
    const GATEWAY = await getGatewayFromFile(path.join(IPFS_PATH, "gateway"));
    if (GATEWAY) return GATEWAY;
  }
  const HOME = Deno.env.get("HOME");
  if (HOME) {
    const GATEWAY = await getGatewayFromFile(
      path.join(HOME, ".ipfs", "gateway"),
    );
    if (GATEWAY) return GATEWAY;
  }
  const CONFIG_HOME = Deno.env.get("XDG_CONFIG_HOME");
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
const fs = unixfs(helia);

const blacklist = [
  "/HALO/dropsondes/Level_1",
  "/HALO/dropsondes/Level_2",
];

const datasetLocations = await collectDatasets(root_cid, "", blacklist);

console.log("all datasets collected, extracting metadata");

const stacItems = await Promise.all(
  datasetLocations.map(async ({ cid, path }) => {
    const store = getStore("ipfs://" + cid.toString(), { helia });
    const timeout = setTimeout(() => {
      console.log(cid.toString(), "takes longer than expected");
    }, 50000);
    const dsMeta = await readDataset(store);
    const src = "ipfs://" + root_cid.toString() + path;
    const metadata = {
      src,
      attrs: extractLoose(dsMeta.attrs),
      variables: dsMeta.variables,
      root_cid,
      item_cid: cid,
    };

    let stacItem;
    for await (const item of parseMetadata(metadata)) {
      stacItem = item;
    }
    console.log(stacItem?.properties?.title);
    clearTimeout(timeout);
    return stacItem as StacItem;
  }),
);

if (args?.outfile !== undefined) {
  await Deno.writeTextFile(args.outfile, JSON.stringify(stacItems));
}
process.exit(0);
