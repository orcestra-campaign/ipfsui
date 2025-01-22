export interface GlobalAttrs {
    title?: string,
    summary?: string,
    creator_name?: string,
    creator_email?: string,
    project?: string,
    platform?: string,
    source?: string,
    history?: string,
    license?: string,
    references?: string,
    keywords?: string,
}

export interface LooseGlobalAttrs extends GlobalAttrs {
    authors?: string,
}