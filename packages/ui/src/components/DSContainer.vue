<script setup lang="ts">
import { shallowRef, unref, computed, watch, onBeforeMount, type ShallowRef } from 'vue'

import PlaneAnimation from './PlaneAnimation.vue';
import ShipAnimation from './ShipAnimation.vue';
import SondeAnimation from './SondeAnimation.vue';

const animations = [PlaneAnimation, ShipAnimation, SondeAnimation];
const Animation = animations[Math.floor(Math.random() * animations.length)];

import Nav from './Nav.vue';
import ItemView from './ItemView.vue';
import { getStore, resolve, stacFromStore } from '@orcestra/utils';
import type { DatasetSrc } from '@orcestra/utils';

import { useHelia } from '../plugins/HeliaProvider';
import type { Helia, Provider } from 'helia';
import type { CID } from 'multiformats';
import PathView from './PathView.vue';

const props = defineProps<{ src: string }>();

const heliaProvider = useHelia();

const srcinfo: ShallowRef<DatasetSrc | undefined> = shallowRef();

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
      // Exclude peers by multiaddr pattern
      const excludeAddrPatterns = [
        /127\.0\.0\.1/,
        /localhost/,
        /ipfs\.io/,
        /dweb\.link/,
        /trustless-gateway\.link/,
      ]

      const addrs = provider.multiaddrs?.map(a => a.toString()) ?? []
      const matchesExcludedAddr = addrs.some(addr =>
        excludeAddrPatterns.some(pattern => pattern.test(addr))
      )

      if (matchesExcludedAddr) continue

      providers.value = [...providers.value, provider];
    }
  }
}

const update = async () => {
    providers.value = [];
    if (heliaProvider.loading.value) return;
    const store = getStore(props.src, {helia: heliaProvider.helia.value});
    srcinfo.value = { src: props.src, ...await resolve_cids(heliaProvider.helia.value, props.src) };
    for await (const item of stacFromStore(store, srcinfo.value)) {
        stac_item.value = item;
    }
    updateProviders();  // execute asynchronously
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
    <PathView v-if="srcinfo?.src" :src="srcinfo?.src as string" :item_cid="srcinfo?.item_cid" />
    <ItemView v-if="stac_item" :item="stac_item" />
    <Animation v-else />
    <div v-if="metadata?.item_cid">Dataset is provided by {{ providedBy }}.</div>
</template>
