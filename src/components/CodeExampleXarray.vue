<script lang="ts">
import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
import hljsVuePlugin from "@highlightjs/vue-plugin";

hljs.registerLanguage('python', python);

export default {
    components: {
        highlightjs: hljsVuePlugin.component
    }
}
</script>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ src: string }>();

const pythonExampleCode = computed(() =>
`import xarray as xr

ds = xr.open_dataset("${props.src}", engine="zarr")
`)
</script>

<template>
    <highlightjs
        class="codeexample"
        language="Python"
        :code="pythonExampleCode"
    ></highlightjs>
</template>

<style>
.hljs {
    border: 1px solid var(--highlight-bg-color);
    border-radius: 5px;
}
</style>
