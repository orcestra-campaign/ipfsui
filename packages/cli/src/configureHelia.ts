import { createHelia, createHeliaLight, type Helia } from "helia";

import { withHTTP } from "@helia/http";

import { FsDatastore } from "datastore-fs";
import { FsBlockstore } from "blockstore-fs";

import * as path from "node:path";
import * as fs from "node:fs/promises";

/// NullRouter is a workaround, remove if upstream fixed

import type { Capability, Provider, Router } from 'helia'

class NullRouter implements Router {
  public readonly name = 'null-router'

  constructor () {
  }

  capabilities (): Capability[] {
    return []
  }

  async * findProviders (): AsyncIterable<Provider> {
  }

  toString (): string {
    return `NullRouter()`
  }
}

export function nullRouter (): Router {
  return new NullRouter()
}

// end workaround

async function getGatewayFromFile(
  filename: string,
): Promise<string | undefined> {
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

  const helia = withHTTP(createHelia({
    datastore,
    blockstore,
  }), {
      recursiveGateways: ["https://latest.orcestra-campaign.org"],
  });
  return helia;
}

async function configureLocalHelia(gateway: string): Promise<Helia> {
  const helia = withHTTP(createHeliaLight({
      routers: [nullRouter()],
    }), {
      allowInsecure: true,
      allowLocal: true,
      delegatedRouters: [],  // there must be a least one non-fallback router. To make an empty list work, we had to use nullRouter
      recursiveGateways: [gateway, "https://latest.orcestra-campaign.org"],
    }
    );
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
  const helia = await(await configureHelia()).start();
  try {
    await action(helia);
  } finally {
    await helia.stop();
  }
}
