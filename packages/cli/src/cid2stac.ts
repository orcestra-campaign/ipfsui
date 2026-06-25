import { StacItem } from "@orcestra/utils";
import { CID } from "multiformats";
import { type Helia } from "helia";
import { getStore, stacFromStore, srcinfoToStacId, getLogger } from "@orcestra/utils";
import { NoStacCache, type StacCache } from "./stacCache.js";

export default async function cid2stac(cid: CID | string, helia: Helia, cache: StacCache = new NoStacCache()): Promise<StacItem> {
  let cid_: CID;
  if (typeof cid === "string") {
    cid_ = CID.parse(cid).toV1();
  } else {
    cid_ = cid.toV1();
  }
  const src = "ipfs://" + cid_.toString();
  const srcinfo = {
    src,
    item_cid: cid_,
    root_cid: cid_,
  };
  const stacId = srcinfoToStacId(srcinfo);
  const cachedItem = await cache.getItem(stacId);
  if (cachedItem !== null) {
    return cachedItem;
  }
  const store = getStore(srcinfo.src, { helia });
  try {
    const item = await stacFromStore(store, srcinfo);
    cache.putItem(item);
    return item;
  } catch (e) {
    const logger = getLogger();
    logger.error("exception while processing CID " + cid_.toString());
    throw e;
  }
}
