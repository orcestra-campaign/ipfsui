type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
Pick<T, Exclude<keyof T, Keys>> 
& {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
}[Keys];

interface Geom1 {
    type: "Point",
    coordinates: [number, number]
}

interface Geom2 {
    type: "LineString" | "MultiPoint",
    coordinates: [number, number][]
}

interface Geom3 {
    type: "Polygon" | "MultiLineString",
    coordinates: [number, number][][]
}

interface Geom4 {
    type: "MultiPolygon",
    coordinates: [number, number][][][]
}
type Geometry = Geom1 | Geom2 | Geom3 | Geom4;

interface _Contact {  // see: https://github.com/stac-extensions/contacts?tab=readme-ov-file#contact-object, there's more
    name?: string,
    organization?: string,
    emails?: [{value: string, roles: [string]}],
}

type Contact = RequireAtLeastOne<_Contact, 'name' | 'organization'>

interface Properties {
    datetime?: string | null,
    title?: string,
    description?: string,
    keywords?: string[],
    license?: string,
    contacts?: Contact[],
    platform?: string,
    mission?: string,
    "processing:lineage"?: string,
    "sci:citation"?: string,
}

interface Link {
    href: string,
    rel: string,
    type?: string,
    title?: string,
    method?: string,
    headers?: Map<string, string | [string]>,
    body?: unknown,
}

interface Asset {
    href: string,
    title?: string,
    description?: string,
    type?: string,
    roles?: string[],
}

export interface StacItem {
    type: string,
    stac_version: string,
    stac_extensions?: string[],
    id: string,
    geometry: Geometry | null,
    bbox?: [number],
    properties: Properties,
    links: Link[],
    assets: Map<string, Asset>,
    collection?: string,
}

export default function parseMetadata(ds: any): StacItem {
    console.log("parseMetadata", ds);
    const properties: Properties = {
        title: ds.attrs?.title,
        description: ds.attrs?.summary,
        keywords: ds.attrs?.keywords,
        license: ds.attrs?.license,
        platform: ds.attrs?.platform,
        mission: ds.attrs?.project,
        "processing:lineage": ds.attrs?.history,
    }

    const names = (ds.attrs.creator_name ?? ds.attrs.authors)?.split(",").map((n:string) => n.trim());
    console.log("attrs", ds.attrs.authors);
    const emails = ds.attrs.creator_email?.split(",").map((n:string) => n.trim());
    const contacts = [];

    if ( names !== undefined ) {
        for( const [i, name] of names.entries()) {
            const es = [];
            if ( emails !== undefined && emails.length > i) {
                es.push({value: emails[i], roles: []});
            }
            contacts.push({name, emails});
        }
        properties.contacts = contacts;
    }

    return {
        type: "Feature",
        stac_version: "1.1.0",
        stac_extensions: [],
        id: "TODO: need some ID / CID",
        geometry: null,
        // bbox: [1,2,3,4],
        properties,
        links: [],
        assets: new Map(),
    }
}