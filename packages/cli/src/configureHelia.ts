import { createHelia, type Helia } from "helia";

import { createHeliaHTTP } from "@helia/http";
import { trustlessGateway } from "@helia/block-brokers";
import { httpGatewayRouting } from "@helia/routers";

import { dns } from "@multiformats/dns";
import { dnsJsonOverHttps } from "@multiformats/dns/resolvers";

import { FsDatastore } from "datastore-fs";
import { FsBlockstore } from "blockstore-fs";

import * as path from "node:path";
import * as fs from "node:fs/promises";

async function getGatewayFromFile(
  filename: string,
): Promise<string | undefined> {
  //console.info("trying", filename);
  try {
    return (await fs.readFile(filename, {encoding: "utf-8"}))?.split("\n")[0]?.trim();
  } catch {
    return undefined;
  }
}

async function getLocalGatewayConfiguration(): Promise<string | undefined> {
  const IPFS_GATEWAY = process.env.IPFS_GATEWAY;
  if (IPFS_GATEWAY) {
    return IPFS_GATEWAY;
  }
  const IPFS_PATH = process.env.IPFS_PATH;
  if (IPFS_PATH) {
    const GATEWAY = await getGatewayFromFile(path.join(IPFS_PATH, "gateway"));
    if (GATEWAY) return GATEWAY;
  }
  const HOME = process.env.HOME;
  if (HOME) {
    const GATEWAY = await getGatewayFromFile(
      path.join(HOME, ".ipfs", "gateway"),
    );
    if (GATEWAY) return GATEWAY;
  }
  const CONFIG_HOME = process.env.XDG_CONFIG_HOME;
  if (CONFIG_HOME) {
    const GATEWAY = await getGatewayFromFile(
      path.join(CONFIG_HOME, "ipfs", "gateway"),
    );
    if (GATEWAY) return GATEWAY;
  }
  {
    const GATEWAY = await getGatewayFromFile(
      path.join("/etc", "ipfs", "gateway"),
    );
    if (GATEWAY) return GATEWAY;
  }
}

async function configureStandaloneHelia(): Promise<Helia> {
  const datastore = new FsDatastore(".helia/datastore");
  const blockstore = new FsBlockstore(".helia/blockstore");

  const resolver = dns({
    resolvers: {
      ".": [
        dnsJsonOverHttps("https://cloudflare-dns.com/dns-query"),
        dnsJsonOverHttps("https://dns.google/resolve"),
      ],
    },
  });

  const helia = await createHelia({
    datastore,
    blockstore,
    dns: resolver,
    libp2p: { dns: resolver },
  });
  //console.info("this node's peerId:", helia.libp2p.peerId.toString());
  return helia;
}

async function configureLocalHelia(gateway: string): Promise<Helia> {
  const helia = await createHeliaHTTP({
    blockBrokers: [
      trustlessGateway({ allowInsecure: true, allowLocal: true }),
    ],
    routers: [
      httpGatewayRouting({
        gateways: [gateway],
      }),
    ],
  });
  return helia;
}

export default async function configureHelia(): Promise<Helia> {
  const gateway = await getLocalGatewayConfiguration();
  if (gateway) {
    //console.log("using local IPFS gateway configuration:", gateway);
    return await configureLocalHelia(gateway);
  } else {
    //console.log("using standalone IPFS implementation");
    return await configureStandaloneHelia();
  }
}

export async function withHelia(action: (helia: Helia) => Promise<void>): Promise<void> {
  const helia = await configureHelia();
  try {
    await action(helia);
  } finally {
    await helia.stop();
  }
}
