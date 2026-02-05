<script setup lang="ts">
import { shallowRef, unref, computed, watch, onBeforeMount, type ShallowRef } from 'vue'

import PlaneAnimation from './PlaneAnimation.vue';
import ShipAnimation from './ShipAnimation.vue';
import SondeAnimation from './SondeAnimation.vue';

const animations = [PlaneAnimation, ShipAnimation, SondeAnimation];
const Animation = animations[Math.floor(Math.random() * animations.length)];

import Nav from './Nav.vue';
import ItemView from './ItemView.vue';
import { parseMetadata, getStore, resolve, readDataset, extractLoose, parseManualMetadata } from '@orcestra/utils';
import type { DatasetSrc, DatasetMetadata, ManualMetadata } from '@orcestra/utils';
import * as yaml from 'js-yaml';

import { useHelia } from '../plugins/HeliaProvider';
import type { Helia, Provider } from 'helia';
import type { CID } from 'multiformats';
import PathView from './PathView.vue';

const props = defineProps<{ src: string }>();

const heliaProvider = useHelia();

const metadata: ShallowRef<DatasetSrc | DatasetMetadata | undefined> = shallowRef();

const stac_item = shallowRef();

const providers = shallowRef<Provider[]>([]);

async function resolve_cids(helia: Helia, src: string): Promise<{root_cid?: CID, item_cid?: CID}> {
    if (!helia) {
        return {};
    }
    const resolveResult = await resolve(helia, src);
    const root_cid = resolveResult?.cids.at(0)?.cid.toV1();
    const item_cid = resolveResult?.cids.at(-1)?.cid.toV1();

    return {root_cid, item_cid};
}

const knownPeers: Record<string, string> = {
  "12D3KooWN1cJjVBqXmCmaNF6yihB9vTuSSeSHJ2kw6waaQ5Mvmsm": "DKRZ",
  "12D3KooWBWikPAjn7SeWVY5uzi42mncf2qdYZu88eFjroVaQ46jw": "GWDG Cloud",
  "12D3KooWL3E6UMhVPHq8tyCKoAybRxQQgE2uGVLVphtmqNhaegE2": "Pi 5 (MPIM)",
  "12D3KooWDxsa98TAgDRVRby6bPxvnHfqBdL1hHBqMqP2PWoSHmcJ": "Pi (lkluft)",
};

function parseProvider(provider: Provider): string | undefined {
  if (provider.id.type === "url") {
    const url = new TextDecoder().decode(provider.id.toMultihash().digest);
    if (url.match(/^https?:\/\/127.0.0.1[:\/]/)) {
      return "local gateway";
    }
    if (url.match(/^https:\/\/.+\.orcestra-campaign\.org\//)) {
      return "ORCESTRA Gateway";
    }
    if (url.match(/^https:\/\/trustless-gateway.link\//)) {
      return "public gateway";
    }
  }
  const short = knownPeers[provider.id.toString()];
  if (short !== undefined) {
    return short;
  }
  for(const ma of provider.multiaddrs) {
    if (ma.toString().match(/^\/dns.\/[^\/]+\.pinata\.cloud\//)) {
      return "Pinata";
    }
  }
  return undefined;
}

const updateProviders = async() => {
  if (metadata.value?.item_cid) {
    for await (const provider of heliaProvider.helia.value.routing.findProviders(metadata.value?.item_cid)) {
      providers.value = [...providers.value, provider];
    }
  }
}

const update = async () => {
    providers.value = [];
    if (heliaProvider.loading.value) return;
    const store = getStore(props.src, {helia: heliaProvider.helia.value});
    const raw_metadata = await store.get("/dataset_meta.yaml");
    if ( raw_metadata ) {
        const dataset_meta = yaml.load(new TextDecoder().decode(raw_metadata)) as ManualMetadata; //TODO: verify correctness
        metadata.value = {src: props.src, ...await resolve_cids(heliaProvider.helia.value, props.src)};
        stac_item.value = parseManualMetadata(dataset_meta, metadata.value);
        return;
    }
    const dsMeta = await readDataset(store);

    const attrs = extractLoose(dsMeta.attrs);
    const variables = dsMeta.variables;

    metadata.value = {src: props.src, attrs, variables};
    console.log(metadata.value);
    metadata.value = {...metadata.value, ...await resolve_cids(heliaProvider.helia.value, props.src)};
    console.log(metadata.value);
    updateProviders();  // execute asynchronously
    if (metadata.value) {
        for await (const item of parseMetadata(unref(metadata.value))) {
            stac_item.value = item;
        }
    }
};

onBeforeMount(update);
watch([() => props.src, heliaProvider?.loading], update);

const providedBy = computed(() => {
  const parsed = [];
  const others = [];
  for (const provider of providers.value) {
    const p = parseProvider(unref(provider));
    if (p !== undefined) {
      parsed.push(p);
    } else {
      others.push(provider.id.toString());
    }
  }
  if (parsed.length > 0) {
    if (others.length > 0) {
      return parsed.join(", ") + " and " + others.length + " others";
    } else {
      return parsed.join(", ")
    }
  } else {
    if (others.length > 0) {
      return others.length + " nodes";
    } else {
      return "no one ¯\_(ツ)_/¯";
    }
  }
})
</script>

<template>
    <div class="navbar">
        <div class="navbar-content">
            <Nav />
        </div>
    </div>
    <PathView v-if="metadata?.src" :src="metadata?.src as string" :item_cid="metadata?.item_cid" />
    <ItemView v-if="stac_item" :item="stac_item" />
    <Animation v-else />
    <div v-if="metadata?.item_cid">Dataset is provided by {{ providedBy }}.</div>
</template>
