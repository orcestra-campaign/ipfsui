<script setup lang="ts">
import { ref, watch, onBeforeMount } from 'vue'
import AttrView from './AttrView.vue';

import * as zarr from "zarrita";
import OpenWithXArrayTip from './OpenWithXArrayTip.vue';

const props = defineProps<{ src: string }>();

const metadata = ref({global_attrs: {}});

const update = async () => {
    const store = await zarr.withConsolidated(new zarr.FetchStore(props.src));
    const group = await zarr.open(store, { kind: "group" });

    console.log(store.contents());
    console.log(group);
    metadata.value = {global_attrs: group.attrs};
};

onBeforeMount(update);
watch(() => props.src, update);
</script>

<template>
    <OpenWithXArrayTip :src="props.src"/>
    <AttrView :attrs="metadata.global_attrs" />
</template>
