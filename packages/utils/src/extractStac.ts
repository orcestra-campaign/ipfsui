import type { StacItem } from "./stac.js";
import type { DatasetMetadata, DatasetSrc } from "./parseMetadata.js";
import type { ManualMetadata } from "./manual_meta.js";
import { parseManualMetadata, default as parseMetadata } from "./parseMetadata.js";
import { readDataset } from "./ds/index.js";
import { extractLoose } from "./dsAttrConvention.js";
import type IPFSFetchStore from "./ipfs/fetchStore.js";
import type { FetchStore } from "zarrita";
import * as yaml from 'js-yaml';

export async function* genStacFromStore(store: IPFSFetchStore | FetchStore, srcinfo: DatasetSrc): AsyncGenerator<StacItem> {
  const raw_metadata = await store.get("/dataset_meta.yaml");
  if ( raw_metadata ) {
      const dataset_meta = yaml.load(new TextDecoder().decode(raw_metadata)) as ManualMetadata; //TODO: verify correctness
      yield parseManualMetadata(dataset_meta, srcinfo);
      return;
  }
  const dsMeta = await readDataset(store);

  const attrs = extractLoose(dsMeta.attrs);
  const variables = dsMeta.variables;
  const metadata: DatasetMetadata = { ...srcinfo, attrs, variables };
  yield* parseMetadata(metadata);
}

export async function stacFromStore(store: IPFSFetchStore | FetchStore, srcinfo: DatasetSrc): Promise<StacItem> {
  let stacItem;
  for await (const item of genStacFromStore(store, srcinfo)) {
    stacItem = item;
  }
  return stacItem as StacItem;
}
