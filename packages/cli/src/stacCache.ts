import { type StacItem } from "@orcestra/utils";
import * as path from "node:path";
import * as fs from "node:fs/promises";

export interface StacCache {
  getItem(id: string): Promise<StacItem | null>;
  putItem(item: StacItem): Promise<void>;
}

export class NoStacCache implements StacCache {
  getItem(_id: string): Promise<StacItem | null> {
    return Promise.resolve(null);
  }
  putItem(_item: StacItem): Promise<void> {
    return Promise.resolve();
  }
}

export class FileStacCache implements StacCache {
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

export function getStacCache(cachedir?: string): StacCache {
  if (cachedir !== undefined) {
    return new FileStacCache(path.join(cachedir, "items"));
  } else {
    return new NoStacCache();
  }
}
