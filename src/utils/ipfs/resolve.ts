//import { createHeliaHTTP, UnknownCodecError } from '@helia/http'
import { type Helia } from "helia";
import { ipns } from "@helia/ipns";
import { peerIdFromCID, peerIdFromString } from "@libp2p/peer-id";
import { type PeerId } from "@libp2p/interface";
import { CID } from "multiformats/cid";
import { walkPath } from "ipfs-unixfs-exporter";

function getPeerIdFromString(peerIdString: string): PeerId {
  if (peerIdString.charAt(0) === "1" || peerIdString.charAt(0) === "Q") {
    return peerIdFromString(peerIdString);
  }

  // try resolving as a base36 CID
  return peerIdFromCID(CID.parse(peerIdString));
}

function joinPaths(resolvedPath: string | undefined, urlPath: string): string {
  let path = "";

  if (resolvedPath != null) {
    path += resolvedPath;
  }

  if (urlPath.length > 0) {
    path = `${path.length > 0 ? `${path}/` : path}${urlPath}`;
  }

  // replace duplicate forward slashes
  path = path.replace(/\/(\/)+/g, "/");

  // strip trailing forward slash if present
  if (path.startsWith("/")) {
    path = path.substring(1);
  }

  return path.split("/").map(decodeURIComponent).join("/");
}

export default async function resolve(helia: Helia, url: string) {
  const name = ipns(helia);
  console.log("helia", helia);
  console.log("name", name);
  const srcUrl = new URL(url);
  console.log(srcUrl);
  if (srcUrl !== undefined) {
    let root_cid;
    let path;
    if (srcUrl?.protocol == "ipns:") {
      try {
        const peerId = getPeerIdFromString(srcUrl.host);
        if (peerId.publicKey === undefined) {
          throw new TypeError("no public key in url");
        }
        const res = await name.resolve(peerId.publicKey);
        root_cid = res.cid;
        path = res.path;
      } catch (err) {
        console.log("can't resolve", url, "using IPNS:", err);
      }
      const res = await name.resolveDNSLink(srcUrl.host);
      root_cid = res.cid;
      path = res.path;
    } else if (srcUrl?.protocol == "ipfs:") {
      root_cid = CID.parse(srcUrl.host);
      path = "";
    }
    if (root_cid !== undefined) {
      path = joinPaths(path, srcUrl?.pathname ?? "");
      const cids = [];
      console.log(root_cid);
      for await (
        const entry of walkPath(
          `${root_cid.toString()}/${path}`,
          helia.blockstore,
        )
      ) {
        cids.push(entry);
        console.log(entry);
      }
      return { cids, path };
    }
  }
  return undefined;
}
