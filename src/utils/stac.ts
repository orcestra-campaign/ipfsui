type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  & Pick<T, Exclude<keyof T, Keys>>
  & {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

interface Geom1 {
  type: "Point";
  coordinates: [number, number];
}

interface Geom2 {
  type: "LineString" | "MultiPoint";
  coordinates: [number, number][];
}

interface Geom3 {
  type: "Polygon" | "MultiLineString";
  coordinates: [number, number][][];
}

interface Geom4 {
  type: "MultiPolygon";
  coordinates: [number, number][][][];
}
export type Geometry = Geom1 | Geom2 | Geom3 | Geom4;

interface _Contact { // see: https://github.com/stac-extensions/contacts?tab=readme-ov-file#contact-object, there's more
  name?: string;
  organization?: string;
  emails?: { value: string; roles: string[] }[];
}

export type Contact = RequireAtLeastOne<_Contact, "name" | "organization">;

export interface Dimension {
  type: string;
  axis?: "x" | "y" | "z";
  description?: string;
  unit?: string;
}

export interface Variable {
  dimensions: string[];
  type: "data" | "auxiliary";
  description?: string;
  extent?: [number | string, number | string];
  values?: (number | string)[];
  unit?: string;
}

export interface Properties {
  datetime?: string | null;
  start_datetime?: string | null;
  end_datetime?: string | null;
  title?: string;
  description?: string;
  keywords?: string[];
  license?: string;
  references?: string[];
  contacts?: Contact[];
  platform?: string;
  mission?: string;
  "processing:lineage"?: string;
  "sci:citation"?: string;
  "cube:dimensions"?: { [key: string]: Dimension };
  "cube:variables"?: { [key: string]: Variable };
}

export interface Link {
  href: string;
  rel: string;
  type?: string;
  title?: string;
  method?: string;
  headers?: { [key: string]: string | [string] };
  body?: unknown;
}

export interface Asset {
  href: string;
  title?: string;
  description?: string;
  type?: string;
  roles?: string[];
}

export type BBox = [number, number, number, number];

export interface StacItem {
  type: string;
  stac_version: string;
  stac_extensions?: string[];
  id: string;
  geometry?: Geometry;
  bbox?: BBox;
  properties: Properties;
  links: Link[];
  assets: { [key: string]: Asset };
  collection?: string;
}
