import { type App, type InjectionKey, type ShallowRef, shallowRef } from "vue";
import { createHelia, type Helia } from "helia";
import { IDBBlockstore } from "blockstore-idb";
import { IDBDatastore } from "datastore-idb";

export const HeliaProviderKey = Symbol("HeliaProvider") as InjectionKey<
  {
    loading: ShallowRef<boolean>;
    error: ShallowRef<string>;
    helia: ShallowRef<Helia>;
  }
>;

export default {
  install: async (app: App) => {
    const loading = shallowRef(true);
    const error = shallowRef("");
    const helia = shallowRef();
    app.provide(HeliaProviderKey, {
      loading,
      error,
      helia,
    });
    try {
      const blockstore = new IDBBlockstore("ipfs/blockstore");
      const datastore = new IDBDatastore("ipfs/datastore");
      await Promise.all([blockstore.open(), datastore.open()]);
      const instance = await createHelia({ blockstore, datastore });
      loading.value = false;
      helia.value = instance;
    } catch (e) {
      console.error(e);
      error.value = (e as Error).toString();
      loading.value = false;
    }
  },
};
