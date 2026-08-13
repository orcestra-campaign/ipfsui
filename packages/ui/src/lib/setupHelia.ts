import { IDBBlockstore } from "blockstore-idb";
import { IDBDatastore } from "datastore-idb";
import { createHeliaLight, type Helia } from "helia";

import { withBitswap } from '@helia/bitswap'
import { withHTTP } from '@helia/http'
import { withLibp2p } from '@helia/libp2p'

async function configureStandaloneHelia(): Promise<Helia> {
  const helia = await withBitswap(withLibp2p(await configureLocalHelia([])));
  return helia;
}

async function configureLocalHelia(gateways: Array<string>): Promise<Helia> {
  console.log("configuring local Helia");
  const blockstore = new IDBBlockstore("ipfs/blockstore");
  const datastore = new IDBDatastore("ipfs/datastore");
  await Promise.all([blockstore.open(), datastore.open()]);
  const helia = await withHTTP(createHeliaLight({
      blockstore,
      datastore,
  }), {
      allowInsecure: true,
      allowLocal: true,
      delegatedRouters: ['https://delegated-ipfs.dev'],
      recursiveGateways: gateways.concat(["https://latest.orcestra-campaign.org"]),
  });
  return helia;
}

export interface SetupHeliaOpts {
  ipfsInBrowser?: boolean;
}

export default async function setupHelia(
  opts: SetupHeliaOpts | undefined,
): Promise<Helia> {
  let helia;
  if (opts?.ipfsInBrowser) {
    helia = await configureStandaloneHelia();
  } else {
    helia = await configureLocalHelia(["http://127.0.0.1:8080"]);
  }
  return await helia.start();
}
