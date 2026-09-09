import * as yaml from "js-yaml";
import * as fs from "node:fs/promises";

export interface PinMeta {
  prev?: string | string[];
  tags?: string[];
  [key: string]: unknown;
}

export interface PinEntry {
  cid: string;
  name?: string;
  meta?: PinMeta;
}

/**
 * Parse pinlist.yaml content (a list of Pin objects per the IPFS Pinning
 * Services API spec) into structured entries.
 */
export function parsePinlist(content: string): PinEntry[] {
  const decoded = yaml.load(content);
  if (!Array.isArray(decoded)) {
    throw new Error("pinlist.yaml must contain a list of Pin objects");
  }
  return decoded.map((entry) => {
    if (typeof entry !== "object" || entry === null) {
      throw new Error("each pinlist entry must be an object");
    }
    const { cid, name, meta } = entry as { cid?: unknown; name?: unknown; meta?: unknown };
    if (typeof cid !== "string" || cid.length === 0) {
      throw new Error("each pinlist entry must have a `cid` string");
    }
    const result: PinEntry = { cid };
    if (typeof name === "string") {
      result.name = name;
    }
    if (meta !== undefined && typeof meta === "object" && meta !== null) {
      result.meta = meta as PinMeta;
    }
    return result;
  });
}

export async function readPinlist(filename: string): Promise<PinEntry[]> {
  const content = await fs.readFile(filename, { encoding: "utf-8" });
  return parsePinlist(content);
}

/**
 * Collect all CIDs referenced by the `meta.prev` attribute of any entry.
 * These datasets are superseded by the entry referencing them and should not
 * be indexed.
 */
export function getSupersededCids(pins: PinEntry[]): Set<string> {
  const superseded = new Set<string>();
  for (const pin of pins) {
    const prev = pin.meta?.prev;
    if (prev === undefined) continue;
    if (Array.isArray(prev)) {
      for (const p of prev) {
        if (typeof p === "string") superseded.add(p);
      }
    } else if (typeof prev === "string") {
      superseded.add(prev);
    }
  }
  return superseded;
}

/**
 * CIDs that are safe to index: every entry whose CID is not superseded by a
 * newer entry.
 */
export function getActiveCids(pins: PinEntry[]): string[] {
  const superseded = getSupersededCids(pins);
  return pins.map((p) => p.cid).filter((cid) => !superseded.has(cid));
}

/**
 * Filter entries to those containing at least one of the given tags.
 * When `tags` is empty, all entries are returned.
 */
export function filterByTags(pins: PinEntry[], tags: string[]): PinEntry[] {
  if (tags.length === 0) return pins;
  const wanted = new Set(tags);
  return pins.filter((p) => {
    const entryTags = p.meta?.tags ?? [];
    return entryTags.some((t) => wanted.has(t));
  });
}

/**
 * Filter out entries that contain any of the given tags.
 */
export function excludeByTags(pins: PinEntry[], tags: string[]): PinEntry[] {
  if (tags.length === 0) return pins;
  const excluded = new Set(tags);
  return pins.filter((p) => {
    const entryTags = p.meta?.tags ?? [];
    return !entryTags.some((t) => excluded.has(t));
  });
}
