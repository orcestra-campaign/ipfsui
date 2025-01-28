//import setupHelia from "../lib/setupHelia.ts";
import { unixfs } from "@helia/unixfs";
import { createHelia } from "helia";
import { CID } from "multiformats";

import { dns } from "@multiformats/dns";
import { dnsJsonOverHttps } from "@multiformats/dns/resolvers";

import { FsDatastore } from "datastore-fs";
import { FsBlockstore } from "blockstore-fs";
import process from "node:process";
import type { UnixFSEntry } from "ipfs-unixfs-exporter";
import { getStore } from "../utils/store.ts";
import { readDataset } from "../utils/ds/index.ts";
import { extractLoose } from "../utils/dsAttrConvention.ts";
import parseMetadata from "../utils/parseMetadata.ts";

import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

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
): Promise<Array<CIDPath>> {
  const res = await Array.fromAsync(fs.ls(cid));
  if (isDataset(res)) {
    console.log("collecting", path);
    return [{ cid, path }];
  } else {
    //return (await Promise.all(res.filter(e => e.type === "directory").map((e) => collectDatasets(e.cid, path + "/" + e.name)))).flat();
    const out = [];
    for (const e of res) {
      if (e.type === "directory") {
        out.push(...await collectDatasets(e.cid, path + "/" + e.name));
      }
    }
    return out;
  }
}

async function configureHelia() {
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

  //const helia = await setupHelia();
  return await createHelia({
    datastore,
    blockstore,
    dns: resolver,
    libp2p: { dns: resolver },
  });
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

const datasetLocations = await collectDatasets(root_cid);

const stacItems = [];
for (const { cid, path } of datasetLocations) {
  const store = getStore("ipfs://" + cid.toString(), { helia });
  const dsMeta = await readDataset(store);
  const src = "ipfs://" + root_cid.toString() + path;
  const metadata = {
    src,
    attrs: extractLoose(dsMeta.attrs),
    variables: dsMeta.variables,
    root_cid,
    item_cid: cid,
  };
  const stacItem = await parseMetadata(metadata);
  console.log(stacItem.properties?.title);
  stacItems.push(stacItem);
}

if (args?.outfile !== undefined) {
  await Deno.writeTextFile(args.outfile, JSON.stringify(stacItems));
}
process.exit(0);
