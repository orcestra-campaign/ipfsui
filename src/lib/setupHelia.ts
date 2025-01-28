import { IDBBlockstore } from "blockstore-idb";
import { IDBDatastore } from "datastore-idb";
import { createHelia, type Helia } from "helia";

export default async function setupHelia(): Promise<Helia> {
  const blockstore = new IDBBlockstore("ipfs/blockstore");
  const datastore = new IDBDatastore("ipfs/datastore");
  await Promise.all([blockstore.open(), datastore.open()]);
  return await createHelia({ blockstore, datastore });
}
