<script setup lang="ts">
import { ref, unref, shallowRef, watch, computed, onBeforeMount } from 'vue'

import * as zarr from "zarrita";
import ItemView from './ItemView.vue';
import parseMetadata from '../utils/parseMetadata';

import { getStore } from '../utils/store';


const props = defineProps<{ src: string }>();

const metadata = shallowRef({attrs: {}, variables: {}});

const stac_item = computed(() => parseMetadata(unref(metadata)));

const update = async () => {
    const store = await zarr.withConsolidated(getStore(props.src));
    const group = await zarr.open(store, { kind: "group" });

    metadata.value = {attrs: group.attrs, variables: {}};

    const contents = store.contents();
    
    const variables: {[key: string]: any} = {};

    for ( const {path, kind } of contents ) {
        if(kind !== "array") {
            continue;
        }
        variables[path.slice(1)] = await zarr.open(group.resolve(path), {kind});
    }

    metadata.value = {attrs: group.attrs, variables};
    console.log(metadata.value);
};

onBeforeMount(update);
watch(() => props.src, update);
</script>

<template>
    <ItemView :item="stac_item" />
</template>
