import {
  type App,
  computed,
  inject,
  type InjectionKey,
  type Ref,
  ref,
  type ShallowRef,
  shallowRef,
  watch,
} from "vue";
import { type Helia } from "helia";
import setupHelia, { type SetupHeliaOpts } from "../lib/setupHelia";

export const HeliaProviderKey = Symbol("HeliaProvider") as InjectionKey<
  {
    loading: ShallowRef<boolean>;
    error: ShallowRef<string>;
    helia: ShallowRef<Helia>;
    inBrowser: Ref<boolean>;
  }
>;

export default {
  install: (app: App) => {
    const error = shallowRef("");
    const helia = shallowRef();
    const inBrowser = ref(false);

    const load = async (opts: SetupHeliaOpts) => {
      try {
        const instance = await setupHelia(opts);
        helia.value = instance;
      } catch (e) {
        console.error(e);
        error.value = (e as Error).toString();
      }
      loader.value = null;
    };

    const loader = shallowRef<null | Promise<void>>(null);
    loader.value = load({ ipfsInBrowser: inBrowser.value });
    const loading = computed(() => loader.value !== null);

    watch(inBrowser, (ipfsInBrowser) => {
      loader.value = load({ ipfsInBrowser });
    });

    app.provide(HeliaProviderKey, {
      loading,
      error,
      helia,
      inBrowser,
    });
  },
};

export function useHelia() {
  const heliaProvider = inject(HeliaProviderKey);
  if (!heliaProvider) throw new Error("no helia provider found!");
  return heliaProvider;
}
