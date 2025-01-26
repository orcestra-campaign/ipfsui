<script setup lang="ts">
import { ref, unref, shallowRef, watch, computed, onBeforeMount } from 'vue'

import * as zarr from "zarrita";
import ItemView from './ItemView.vue';
import parseMetadata from '../utils/parseMetadata';

import { getStore } from '../utils/store';
import ItemDebugView from './ItemDebugView.vue';

const props = defineProps<{ src: string }>();

const metadata = shallowRef({src: "", attrs: {}, variables: {}});

const stac_item = ref();

const allAttrs = computed(() => {
    const {attrs, variables} = metadata.value;
    return {attrs, ...Object.fromEntries(Object.entries(variables).map(([k, v]) => [k, {attrs: v?.attrs || {}}]))};
});

const update = async () => {
    const store = await zarr.withConsolidated(getStore(props.src));
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
    stac_item.value = await parseMetadata(unref(metadata));
};

onBeforeMount(update);
watch(() => props.src, update);
</script>

<template>
    <ItemView v-if="stac_item" :item="stac_item" />
    <ItemDebugView v-if="stac_item" :item="stac_item" :dsattrs="allAttrs" />
</template>
