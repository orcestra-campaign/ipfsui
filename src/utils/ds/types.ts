import type { Array, DataType, FetchStore, Listable } from "zarrita";
import type IPFSFetchStore from "../ipfs/fetchStore.ts";

type _SomeStore = FetchStore | IPFSFetchStore;
export type ListableStore = Listable<_SomeStore>;
export type SomeStore = _SomeStore | ListableStore;
export type SomeArray = Array<DataType, SomeStore>;

export function isListableStore(
  store: { get: unknown; contents?: unknown },
): store is ListableStore {
  return store && store?.contents !== undefined;
}

export interface Dataset {
  attrs: { [key: string]: unknown };
  variables: { [key: string]: SomeArray };
}
