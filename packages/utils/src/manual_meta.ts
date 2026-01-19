import type { BBox } from "./stac.js"

export interface ManualAttributes {
  title?: string,
  summary?: string,
  creator_name?: string,
  creator_email?: string,
  license?: string,
  history?: string,
  keywords?: string,
  platform?: string,
  project?: string,
  references?: string,
  source?: string,
}

export interface ManualExtent {
  temporal: [string, string],
  spatial: BBox,
}

export interface ManualMetadata {
  attributes: ManualAttributes,
  extent: ManualExtent,
}
