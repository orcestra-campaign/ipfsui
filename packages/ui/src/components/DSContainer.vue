<script setup lang="ts">
import { shallowRef, unref, watch, onBeforeMount, type ShallowRef } from 'vue'

import PlaneAnimation from './PlaneAnimation.vue';
import ShipAnimation from './ShipAnimation.vue';
import SondeAnimation from './SondeAnimation.vue';

const animations = [PlaneAnimation, ShipAnimation, SondeAnimation];
const Animation = animations[Math.floor(Math.random() * animations.length)];

import Nav from './Nav.vue';
import ItemView from './ItemView.vue';
import { parseMetadata, getStore, resolve, readDataset, extractLoose, metadataToStacId, parseManualMetadata } from '@orcestra/utils';
import type { DatasetMetadata, ManualMetadata } from '@orcestra/utils';
import * as yaml from 'js-yaml';

import { useHelia } from '../plugins/HeliaProvider';
import PathView from './PathView.vue';

const props = defineProps<{ src: string }>();

const heliaProvider = useHelia();

const metadata: ShallowRef<DatasetMetadata | undefined> = shallowRef();

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
    const raw_metadata = await store.get("/dataset_meta.yaml");
    if ( raw_metadata ) {
        const dataset_meta = yaml.load(new TextDecoder().decode(raw_metadata));
        metadata.value = {src: props.src, ...resolve_cids(heliaProvider.helia.value, props.src)};
        stac_item.value = parseManualMetadata(dataset_meta, metadata.value);
        return;
    }
    const dsMeta = await readDataset(store);

    const attrs = extractLoose(dsMeta.attrs);
    const variables = dsMeta.variables;

    metadata.value = {src: props.src, attrs, variables};
    console.log(metadata.value);
    metadata.value = {...metadata.value, ...resolve_cids(heliaProvider.helia.value, props.src)};
    console.log(metadata.value);
    if (metadata.value) {
        for await (const item of parseMetadata(unref(metadata))) {
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
