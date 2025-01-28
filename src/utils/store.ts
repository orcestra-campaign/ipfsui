import { type Helia } from "helia";
import IPFSFetchStore from "./ipfs/fetchStore.ts";
import { FetchStore } from "zarrita";

export function getStore(url: string | URL, options?: { helia?: Helia }) {
  const [protocol, _] = (typeof url === "string" ? url : url.href).split(
    "://",
  );
  if (protocol === "ipfs" || protocol === "ipns") {
    return new IPFSFetchStore(url, options);
  } else {
    return new FetchStore(url);
  }
}
