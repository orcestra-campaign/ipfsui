<script setup lang="ts">
import { ref, unref, shallowRef, watch, onBeforeMount, inject, type Ref } from 'vue'

import PlaneAnimation from './PlaneAnimation.vue';
import ShipAnimation from './ShipAnimation.vue';
import SondeAnimation from './SondeAnimation.vue';

const animations = [PlaneAnimation, ShipAnimation, SondeAnimation];
const Animation = animations[Math.floor(Math.random() * animations.length)];

import ItemView from './ItemView.vue';
import parseMetadata from '../utils/parseMetadata';
import { type DatasetMetadata } from '../utils/parseMetadata';

import { getStore } from '../utils/store';

import { useHelia } from '../plugins/HeliaProvider';
import resolve from '../utils/ipfs/resolve';
import PathView from './PathView.vue';
import { readDataset } from '../utils/ds';
import { extractLoose } from '../utils/dsAttrConvention';

const props = defineProps<{ src: string }>();

const heliaProvider = useHelia();

const metadata: Ref<DatasetMetadata | undefined> = shallowRef();

const stac_item = shallowRef();

async function resolve_cids(helia, src): {root_cid?: CID, item_cid?: CID} {
    if (!helia) {
        return {};
    }
    const resolveResult = await resolve(helia, src);
    const root_cid = resolveResult?.cids.at(0)?.cid.toV1();
    const item_cid = resolveResult?.cids.at(-1)?.cid.toV1();

    return {root_cid, item_cid};
}

const update = async () => {
    if (heliaProvider.loading.value) return;
    const store = getStore(props.src, {helia: heliaProvider.helia.value});
    const dsMeta = await readDataset(store);

    const attrs = extractLoose(dsMeta.attrs);
    const variables = dsMeta.variables;
    
    metadata.value = {src: props.src, attrs, variables};

    console.log(metadata.value);

    metadata.value = {...metadata.value, ...resolve_cids(heliaProvider.helia.value, props.src)};
    console.log(metadata.value);
    for await (const item of parseMetadata(unref(metadata))) {
        stac_item.value = item;
    }
};

onBeforeMount(update);
watch([() => props.src, heliaProvider?.loading], update);
</script>

<template>
    <PathView v-if="metadata?.src" :src="metadata?.src as string" :item_cid="metadata?.item_cid" />
    <ItemView v-if="stac_item" :item="stac_item" />
    <Animation v-else />
</template>
