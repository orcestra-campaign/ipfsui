export interface GlobalAttrs {
  title?: string;
  summary?: string;
  creator_name?: string;
  creator_email?: string;
  project?: string;
  platform?: string;
  source?: string;
  history?: string;
  license?: string;
  references?: string;
  keywords?: string;
}

export interface LooseGlobalAttrs extends GlobalAttrs {
  featureType?: string;
  authors?: string;
}

export function extractLoose(
  attrs: Record<string, undefined>,
): LooseGlobalAttrs {
  return Object.fromEntries(
    Object.entries(attrs).filter(([_k, v]) => typeof v === "string"),
  );
}
