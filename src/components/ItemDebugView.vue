<script setup lang="ts">
import JsonViewer from 'vue-json-viewer'
import 'vue-json-viewer/style.css'

const props = defineProps<{ item: {} }>();
</script>

<template>
    <div class="raw">
        <JsonViewer :value="props.item" :expand-depth=3></JsonViewer>
    </div>
</template>

<style scoped>
</style>