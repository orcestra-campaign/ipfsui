import { type App, type InjectionKey, type ShallowRef, shallowRef } from "vue";
import { type Helia } from "helia";
import setupHelia from "../lib/setupHelia";

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
      const instance = await setupHelia();
      loading.value = false;
      helia.value = instance;
    } catch (e) {
      console.error(e);
      error.value = (e as Error).toString();
      loading.value = false;
    }
  },
};
