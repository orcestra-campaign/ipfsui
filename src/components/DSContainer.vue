<script setup lang="ts">
import { ref, unref, shallowRef, watch, computed, onBeforeMount, inject, type Ref } from 'vue'

import * as zarr from "zarrita";
import ItemView from './ItemView.vue';
import parseMetadata from '../utils/parseMetadata';
import { type DatasetMetadata } from '../utils/parseMetadata';

import { getStore } from '../utils/store';
import ItemDebugView from './ItemDebugView.vue';

import { HeliaProviderKey } from '../plugins/HeliaProvider';
import resolve from '../utils/ipfs/resolve';
import PathView from './PathView.vue';

const props = defineProps<{ src: string }>();

const heliaProvider = inject(HeliaProviderKey);

const metadata: Ref<DatasetMetadata | undefined> = shallowRef();

const stac_item = ref();

const allAttrs = computed(() => {
    if (metadata.value !== undefined) {
        const {attrs, variables} = metadata.value;
        return {attrs, ...Object.fromEntries(Object.entries(variables).map(([k, v]) => [k, {attrs: v?.attrs || {}}]))};
    } else {
        return {attrs: {}, variables: {}};
    }
});

const update = async () => {
    if (heliaProvider.loading.value) return;
    const store = await zarr.withConsolidated(getStore(props.src, heliaProvider?.helia?.value));
    const group = await zarr.open(store, { kind: "group" });

    metadata.value = {src: props.src, attrs: group.attrs, variables: {}};

    const contents = store.contents();
    
    const variables: {[key: string]: any} = {};

    for ( const {path, kind } of contents ) {
        if(kind !== "array") {
            continue;
        }
        variables[path.slice(1)] = await zarr.open(group.resolve(path), {kind});
    }

    metadata.value = {src: props.src, attrs: group.attrs, variables};
    console.log(metadata.value);

    if (heliaProvider?.helia?.value) {
        const helia = heliaProvider.helia.value;
        const resolveResult = await resolve(helia, props.src);
        const root_cid = resolveResult?.cids.at(0)?.cid;
        const item_cid = resolveResult?.cids.at(-1)?.cid;

        /*
        if (item_cid !== undefined) {
            stableSrc = "ipfs://" + item_cid.toString();
        }
        */
        metadata.value = {src: props.src, attrs: group.attrs, variables, root_cid, item_cid};
        console.log("IPNS resolve", props.src, item_cid?.toString());
    } else {
        metadata.value = {src: props.src, attrs: group.attrs, variables};
    }
    console.log(metadata.value);
    stac_item.value = await parseMetadata(unref(metadata));
};

onBeforeMount(update);
watch([() => props.src, heliaProvider.loading], update);
</script>

<template>
    <PathView v-bind="metadata" />
    <ItemView v-if="stac_item" :item="stac_item" />
    <ItemDebugView v-if="stac_item" :item="stac_item" :dsattrs="allAttrs" />
</template>
