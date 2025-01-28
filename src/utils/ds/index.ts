import { open, withConsolidated } from "zarrita";
import type { SomeArray } from "./types.ts";
import { type Dataset, isListableStore, type SomeStore } from "./types.ts";

export { Array, get, slice } from "zarrita";

export function getDimensions(array: SomeArray): string[] | undefined {
  return array.attrs?._ARRAY_DIMENSIONS as string[];
}

export async function readDataset(
  store: SomeStore, /*| Listable<SomeStore>*/
): Promise<Dataset> {
  //const _store  = (store?.contents !== undefined) ? store : await withConsolidated(store);

  const _store = isListableStore(store) ? store : await withConsolidated(store);
  const group = await open(_store, { kind: "group" });
  const contents = _store.contents();

  const variables: Record<string, SomeArray> = {};

  for (const { path, kind } of contents) {
    if (kind !== "array") {
      continue;
    }
    variables[path.slice(1)] = await open(group.resolve(path), { kind });
  }

  return { attrs: group.attrs, variables };
}
