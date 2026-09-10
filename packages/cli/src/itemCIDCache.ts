import { CID } from "multiformats";
import * as path from "node:path";
import * as fs from "node:fs/promises";

export interface CIDPath {
  cid: CID;
  path: string;
}

export interface ItemCIDCache {
  getItem(root: CID): Promise<Array<CIDPath> | null>;
  putItem(root: CID, items: Array<CIDPath>): Promise<void>;
}

export class NoItemCIDCache implements ItemCIDCache {
  getItem(_root: CID): Promise<Array<CIDPath> | null> {
    return Promise.resolve(null);
  }
  putItem(_root: CID, _items: Array<CIDPath>): Promise<void> {
    return Promise.resolve();
  }
}

export class FileItemCIDCache implements ItemCIDCache {
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

export function getItemCIDCache(cachedir?: string): ItemCIDCache {
  if (cachedir !== undefined) {
    return new FileItemCIDCache(path.join(cachedir, "cidlist"));
  } else {
    return new NoItemCIDCache();
  }
}
