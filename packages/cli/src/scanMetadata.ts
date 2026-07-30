import { CID } from "multiformats";
import type { UnixFSDirectoryEntry } from "ipfs-unixfs-exporter";
import { DeltaCodec } from "@orcestra/utils";
import pLimit from "p-limit";
import { registry } from "zarrita";
import { Monitor, NoMonitor } from "./scanMonitor.js";
import { NoItemCIDCache, ItemCIDCache, type CIDPath } from "./itemCIDCache.js";
import { type UnixFS } from "@helia/unixfs";

type LimitFunction = <Args extends unknown[], R>(f: (...args: Args) => PromiseLike<R> | R, ...args: Args) => Promise<R>;

//@ts-expect-error doesn't work with types...
registry.set("delta", () => DeltaCodec);


const crawlLimit = pLimit(30);

const DAG_PB = 112;

async function isDirectory(cid: CID, fs: UnixFS, limit: LimitFunction) {
    if (cid.code != DAG_PB) {
        return false;
    }
    const entryStats = await limit(() => fs.stat(cid));
    return entryStats.type == "directory";
}

async function isDataset(directoryListing: Array<UnixFSDirectoryEntry>, fs: UnixFS, limit: LimitFunction) {
  for (const entry of directoryListing) {
    if ([".zgroup", "dataset_meta.yaml"].includes(entry.name)) {
        const entryStats = await limit(() => fs.stat(entry.cid));
        if (["file", "raw", "identity"].includes(entryStats.type)) {
            return true;
        }
    }
  }
  return false;
}

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

  const limit : LimitFunction = <Args extends unknown[], R>(
      f: (...args: Args) => PromiseLike<R> | R,
      ...args: Args
    ): Promise<R> => crawlLimit(async () => {
      monitor.setState(path, "IO");
      const res : R = await f(...args);
      monitor.setState(path, "default");
      return res;
  });


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
    let out = [];
    const res = await limit(() => Array.fromAsync(fs.ls(cid)));
    if (await isDataset(res, fs, limit)) {
      console.log("collected", path);
      out = [{ cid: cid.toV1(), path }];
    } else {
      monitor.setState(path, "IO");
      const is_dir = await Promise.all(res.map((e) => isDirectory(e.cid, fs, crawlLimit)));
      monitor.setState(path, "recurse");
      out = (await Promise.all(
        res.filter((_, i) => is_dir[i]).map((e) =>
          collectDatasets(e.cid, fs, { ...options, path: path + "/" + e.name })
        ),
      )).flat();
    }
    monitor.leavePath(path);
    await cache.putItem(cid, out);
    return out;
  } catch (e) {
    console.error(e);
    throw(e);
  }
}
