import { type Helia } from "helia";
import { ipns } from "@helia/ipns";
import { dnsLink } from "@helia/dnslink";
import { peerIdFromString } from "@libp2p/peer-id";
import { CID } from "multiformats/cid";
import { walkPath } from "ipfs-unixfs-exporter";

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
  try {
    const srcUrl = new URL(url);
    let rootCid: CID | undefined;
    let resolvedPath = "";
    
    // Handle IPNS URLs
    if (srcUrl.protocol === "ipns:") {
      const ipnsService = ipns(helia);
      const dnsLinkService = dnsLink(helia);
      
      // First try DNSLink resolution (for domain-based IPNS names)
      try {
        const dnsLinkResults = await dnsLinkService.resolve(srcUrl.host);
        if (dnsLinkResults && dnsLinkResults.length > 0) {
          for (const result of dnsLinkResults) {
            if ('cid' in result && result.cid) {
              rootCid = result.cid;
              resolvedPath = 'path' in result ? result.path || "" : "";
              break;
            }
          }
        }
      } catch (dnsError: any) {
        console.log(`DNSLink resolution failed for ${srcUrl.host}:`, dnsError.message);
      }
      
      // If DNSLink failed, try IPNS resolution (for peer ID-based names)
      if (!rootCid) {
        try {
          const peerId = peerIdFromString(srcUrl.host);
          if (peerId.publicKey === undefined) {
            throw new TypeError("no public key in url");
          }
          
          // IPNS resolution returns an AsyncGenerator
          // Convert peerId to string for IPNS resolution
          const peerIdString = peerId.toString();
          for await (const result of ipnsService.resolve(peerIdString)) {
            if (result.value && result.value.startsWith('/ipfs/')) {
              const valueParts = result.value.split('/');
              rootCid = CID.parse(valueParts[2]); // Extract CID from /ipfs/CID/path
              resolvedPath = valueParts.slice(3).join('/') || "";
              break;
            }
          }
        } catch (ipnsError: any) {
          console.log(`IPNS resolution failed for ${srcUrl.host}:`, ipnsError.message);
        }
      }
    
    // Handle IPFS URLs
    } else if (srcUrl.protocol === "ipfs:") {
      rootCid = CID.parse(srcUrl.host);
      resolvedPath = "";
    }
    
    // If we have a root CID, resolve the full path
    if (rootCid) {
      // Combine the resolved path with any additional URL path
      const fullPath = joinPaths(resolvedPath, srcUrl.pathname || "");
      
      // Walk the path to get all CIDs
      const cids = [];
      for await (const entry of walkPath(
        `${rootCid.toString()}/${fullPath}`,
        helia.blockstore,
      )) {
        cids.push(entry);
      }
      
      return { 
        cids, 
        path: fullPath,
        rootCid: rootCid.toString()
      };
    }
    
    return undefined;
  } catch (error) {
    console.error(`Failed to resolve URL ${url}:`, error);
    return undefined;
  }
}
