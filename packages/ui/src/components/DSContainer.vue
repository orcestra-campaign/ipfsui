<script setup lang="ts">
import { shallowRef, watch, onBeforeMount, type ShallowRef } from 'vue'

import PlaneAnimation from './PlaneAnimation.vue';
import ShipAnimation from './ShipAnimation.vue';
import SondeAnimation from './SondeAnimation.vue';

const animations = [PlaneAnimation, ShipAnimation, SondeAnimation];
const Animation = animations[Math.floor(Math.random() * animations.length)];

import Nav from './Nav.vue';
import ItemView from './ItemView.vue';
import { parseMetadata, getStore, resolve, readDataset, extractLoose } from '@orcestra/utils';
import type { DatasetMetadata } from '@orcestra/utils';

import { useHelia } from '../plugins/HeliaProvider';
import PathView from './PathView.vue';

const props = defineProps<{ src: string }>();

const heliaProvider = useHelia();

const metadata: ShallowRef<DatasetMetadata | undefined> = shallowRef();

const stac_item = shallowRef();

const update = async () => {
    if (heliaProvider.loading.value) return;
    const store = getStore(props.src, {helia: heliaProvider.helia.value});
    const dsMeta = await readDataset(store);

    const attrs = extractLoose(dsMeta.attrs);
    const variables = dsMeta.variables;

    metadata.value = {src: props.src, attrs, variables};

    console.log(metadata.value);

    if (heliaProvider.helia.value) {
        const helia = heliaProvider.helia.value;
        const resolveResult = await resolve(helia, props.src);
        const root_cid = resolveResult?.cids.at(0)?.cid.toV1();
        const item_cid = resolveResult?.cids.at(-1)?.cid.toV1();

        metadata.value = {src: props.src, attrs, variables, root_cid, item_cid};
        console.log("IPNS resolve", props.src, item_cid?.toString());
    }
    console.log(metadata.value);
    if (metadata.value) {
        for await (const item of parseMetadata(metadata.value)) {
            stac_item.value = item;
        }
    }
};

onBeforeMount(update);
watch([() => props.src, heliaProvider?.loading], update);
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
</template>
