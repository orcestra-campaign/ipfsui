import { CID } from "multiformats";
import type { UnixFSEntry } from "ipfs-unixfs-exporter";
import { DeltaCodec } from "@orcestra/utils";
import pLimit from "p-limit";
import { registry } from "zarrita";
import { Monitor, NoMonitor } from "./scanMonitor.js";
import { NoItemCIDCache, ItemCIDCache, type CIDPath } from "./itemCIDCache.js";
import { type UnixFS } from "@helia/unixfs";

//@ts-expect-error doesn't work with types...
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

const crawlLimit = pLimit(30);

export async function collectDatasets(
  cid: CID,
  fs: UnixFS,
  options: {
    path?: string,
    blacklist?: string[],
    monitor?: Monitor,
    cache?: ItemCIDCache,
  }
): Promise<Array<CIDPath>> {
  const path = options.path || "";
  const blacklist = options.blacklist || [];
  const monitor = options.monitor || new NoMonitor();
  const cache = options.cache || new NoItemCIDCache();

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
  const res = await crawlLimit(() => Array.fromAsync(fs.ls(cid)));
  if (isDataset(res)) {
    console.log("collected", path);
    monitor.leavePath(path);
    return [{ cid: cid.toV1(), path }];
  } else {
    const out = (await Promise.all(
      res.filter((e) => e.type === "directory").map((e) =>
        collectDatasets(e.cid, fs, { ...options, path: path + "/" + e.name })
      ),
    )).flat();
    monitor.leavePath(path);
    await cache.putItem(cid, out);
    return out;
  }
  } catch (e) {
    console.error(e);
  }
  return [];
}
