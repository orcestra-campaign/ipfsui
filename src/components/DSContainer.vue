<script setup lang="ts">
import { ref, unref, watch, computed, onBeforeMount } from 'vue'

import * as zarr from "zarrita";
import ItemView from './ItemView.vue';
import parseMetadata from '../utils/parseMetadata';

import { getStore } from '../utils/store';


const props = defineProps<{ src: string }>();

const metadata = ref({attrs: {}, variables: {}});

const stac_item = computed(() => parseMetadata(unref(metadata)));

const update = async () => {
    const store = await zarr.withConsolidated(getStore(props.src));
    const group = await zarr.open(store, { kind: "group" });

    metadata.value = {attrs: group.attrs, variables: {}};

    const contents = store.contents();
    
    const variables = {};

    for ( const {path, kind } of contents ) {
        if(kind !== "array") {
            continue;
        }
        const variable = await zarr.open(group.resolve(path), {kind});
        variables[path.slice(1)] = {
            shape: variable.shape,
            chunks: variable.chunks,
            attrs: variable.attrs
        };
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
