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
    border-width: 2px;
    border-radius: 5px;
    border-color: var(--highlight-bg-color);
    padding: 3px 5px;
    overflow: scroll;
}

.pathView:has(+ .head) {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
}

div.srcPath {
    font-weight: bold;
}
div.CID{
    font-family: 'Courier New', Courier, monospace;
}

@keyframes scrollHint {
    0% {
        transform: translateX(0);
    }
    50% {
        transform: translateX(-10px);
    }
    100% {
        transform: translateX(0);
    }
}

@media (width <= 585px) {
    div.CID, div.srcPath {
        animation: scrollHint .4s;
    }
}
</style>
