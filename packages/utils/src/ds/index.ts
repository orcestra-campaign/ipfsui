import { open, withConsolidatedMetadata } from "zarrita";
import type { SomeArray } from "./types.js";
import { type Dataset, isListableStore, type SomeStore } from "./types.js";

export { Array, get, slice } from "zarrita";

export function getDimensions(array: SomeArray): string[] | undefined {
  // Prefer dimensionNames (zarrita exposes this for both v2 and v3 arrays)
  if (array.dimensionNames) return array.dimensionNames;
  // Fall back to _ARRAY_DIMENSIONS attribute (CF convention)
  return array.attrs?._ARRAY_DIMENSIONS as string[] | undefined;
}

export async function readDataset(
  store: SomeStore, /*| Listable<SomeStore>*/
): Promise<Dataset> {
  //const _store  = (store?.contents !== undefined) ? store : await withConsolidated(store);

  const _store = isListableStore(store) ? store : await withConsolidatedMetadata(store);
  const group = await open(_store, { kind: "group" });
  const contents = _store.contents();

  const variables: Record<string, SomeArray> = {};

  for (const { path, kind } of contents) {
    if (kind !== "array") {
      continue;
    }
    // `contents()` from `withConsolidatedMetadata` returns paths without a leading slash.
    // Normalize to absolute path so `slice(1)` produces the correct variable name
    // and `group.resolve()` looks up the cached metadata key correctly.
    const resolved = path.startsWith("/") ? path : `/${path}`;
    variables[resolved.slice(1)] = await open(group.resolve(resolved), { kind: "array" });
  }

  return {
    attrs: Object.fromEntries(
      Object.entries(group.attrs).filter(([k, v]) =>
        typeof k === "string" && typeof v === "string"
      ),
    ) as Record<string, string>,
    variables,
  };
}
