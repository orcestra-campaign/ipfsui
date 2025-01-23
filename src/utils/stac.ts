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

export interface Properties {
  datetime?: string | null;
  start_datetime?: string | null;
  end_datetime?: string | null;
  title?: string;
  description?: string;
  keywords?: string[];
  license?: string;
  contacts?: Contact[];
  platform?: string;
  mission?: string;
  "processing:lineage"?: string;
  "sci:citation"?: string;
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

export interface StacItem {
  type: string;
  stac_version: string;
  stac_extensions?: string[];
  id: string;
  geometry: Geometry | null;
  bbox?: [number];
  properties: Properties;
  links: Link[];
  assets: { [key: string]: Asset };
  collection?: string;
}
