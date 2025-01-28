import type { Array, DataType, FetchStore } from "zarrita";
import type IPFSFetchStore from "../ipfs/fetchStore";

export type SomeStore = FetchStore | IPFSFetchStore;
export type SomeArray = Array<DataType, SomeStore>;

export interface Dataset {
  attrs: { [key: string]: unknown };
  variables: { [key: string]: SomeArray };
}
