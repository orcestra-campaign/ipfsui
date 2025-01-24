import type { SomeArray } from "./types";

export { Array, get, slice } from "zarrita";

export function getDimensions(array: SomeArray): string[] | undefined {
  return array.attrs?._ARRAY_DIMENSIONS as string[];
}
