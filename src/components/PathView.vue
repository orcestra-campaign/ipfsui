<script setup lang="ts">

import { CID } from "multiformats";

const {src, item_cid} = defineProps<{ src: string, item_cid?: CID }>();
</script>

<template>
    <div class="pathView">
        <div class="srcPath">{{ src }}</div>
        <div class="CID">
            <span class="CID" v-if="item_cid">{{ item_cid.toString() }}</span>
        </div>
    </div>
</template>

<style scoped>
.pathView {
    border-style: solid;
    border-top-width: 2px;
    border-left-width: 2px;
    border-right-width: 2px;
    border-bottom-width: 0;
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
    border-color: var(--highlight-bg-color);
    padding: 3px 5px;
    overflow: hidden;
}
div.srcPath {
    font-weight: bold;
}
div.CID{
    font-family: 'Courier New', Courier, monospace;
}
</style>