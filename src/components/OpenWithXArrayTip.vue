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

const props = defineProps<{ src: {} }>();

const pythonExampleCode = computed(() =>
`import xarray as xr
ds = xr.open_dataset("${props.src}")
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
.codeexample {
    border: solid;
    border-width: 1px;
    margin: 5px;
    padding: 5px;
    border-radius: 5px;
}
.hljs-keyword {
    color: blue;
}
.hljs-string {
    color: darkred;
}
</style>