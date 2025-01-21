<script setup lang="ts">
import { computed, unref } from 'vue';
import AttrView from './AttrView.vue';
import OpenWithXArrayTip from './OpenWithXArrayTip.vue';

const props = defineProps<{ src: string, metadata: {} }>();
const authors = computed(() => {
    const attrs = props.metadata.global_attrs;
    return attrs.contributor_name ?? attrs.authors;
});
const summary = computed(() => {
    return props.metadata.global_attrs.summary;
});

const dimensions = computed(() => {
    let dims = {};
    const variables = unref(props.metadata.variables);
    for (const varname in variables) {
        const variable = variables[varname];
        const dimensions = variable?.attrs?._ARRAY_DIMENSIONS;
        const shape = variable?.shape;
        if (dimensions !== undefined && shape !== undefined) {
            for (const [i, d] of dimensions.entries()) {
                if ( dims[d] === undefined ) {
                    dims[d] = variable.shape[i];
                } else {
                    console.assert(dims[d] === variable.shape[i])
                }
            }
        }
    }
    return dims;
});
</script>

<template>
    <h1 class="title">{{ metadata.global_attrs.title }}</h1>
    <div class="authors">{{ authors }}</div>
    <div class="summary">{{ summary }}</div>
    <div class="dataset">
        <div class="dimensions">{{  dimensions }}</div>

    </div>
    <div class="usage">
        <h2>usage</h2>
        <h3>xarray</h3>
        <OpenWithXArrayTip :src="props.src"/>
    </div>
    <div class="detail">
        <h2>details</h2>
        <AttrView :attrs="metadata.global_attrs" />
        <code>
            {{  props.metadata }}
        </code>
    </div>
</template>

<style scoped>
</style>