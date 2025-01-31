import { IDBBlockstore } from "blockstore-idb";
import { IDBDatastore } from "datastore-idb";
import { createHelia, type Helia } from "helia";

import { createHeliaHTTP } from "@helia/http";
import { trustlessGateway } from "@helia/block-brokers";
import { delegatedHTTPRouting, httpGatewayRouting } from "@helia/routers";

async function configureStandaloneHelia(): Promise<Helia> {
  const blockstore = new IDBBlockstore("ipfs/blockstore");
  const datastore = new IDBDatastore("ipfs/datastore");
  await Promise.all([blockstore.open(), datastore.open()]);
  return await createHelia({ blockstore, datastore });
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
      delegatedHTTPRouting("https://delegated-ipfs.dev"),
      httpGatewayRouting({
        gateways: ["https://trustless-gateway.link"],
      }),
    ],
  });
  return helia;
}

export interface SetupHeliaOpts {
  ipfsInBrowser?: boolean;
}

export default function setupHelia(
  opts: SetupHeliaOpts | undefined,
): Promise<Helia> {
  if (opts?.ipfsInBrowser) {
    return configureStandaloneHelia();
  } else {
    return configureLocalHelia("http://127.0.0.1:8080");
  }
}
