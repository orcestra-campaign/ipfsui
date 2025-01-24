<script setup lang="ts">
import JsonViewer from 'vue-json-viewer'
import 'vue-json-viewer/style.css'

const props = defineProps<{ item: {}, dsattrs: {} }>();
</script>

<template>
    <div class="raw">
        <JsonViewer :value="props.item" :expand-depth=2></JsonViewer>
        <JsonViewer :value="props.dsattrs" :expand-depth=1></JsonViewer>
    </div>
</template>

<style scoped>
</style>