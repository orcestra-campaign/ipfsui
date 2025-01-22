import type { StacItem, Properties } from "./stac";

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