<script setup lang="ts">
import { shallowRef, watch, onBeforeMount, type ShallowRef } from 'vue'

import PlaneAnimation from './PlaneAnimation.vue';
import ShipAnimation from './ShipAnimation.vue';
import SondeAnimation from './SondeAnimation.vue';

const animations = [PlaneAnimation, ShipAnimation, SondeAnimation];
const Animation = animations[Math.floor(Math.random() * animations.length)];

import Nav from './Nav.vue';
import ItemView from './ItemView.vue';
import { getStore, resolve, stacFromStore } from '@orcestra/utils';
import type { DatasetSrc } from '@orcestra/utils';

import { useHelia } from '../plugins/HeliaProvider';
import type { Helia } from 'helia';
import type { CID } from 'multiformats';
import PathView from './PathView.vue';

const props = defineProps<{ src: string }>();

const heliaProvider = useHelia();

const srcinfo: ShallowRef<DatasetSrc | undefined> = shallowRef();

const stac_item = shallowRef();

async function resolve_cids(helia: Helia, src: string): Promise<{root_cid?: CID, item_cid?: CID}> {
    if (!helia) {
        return {};
    }
    const resolveResult = await resolve(helia, src);
    const root_cid = resolveResult?.cids.at(0)?.cid.toV1();
    const item_cid = resolveResult?.cids.at(-1)?.cid.toV1();

    return {root_cid, item_cid};
}

const update = async () => {
    if (heliaProvider.loading.value) return;
    const store = getStore(props.src, {helia: heliaProvider.helia.value});
    srcinfo.value = { src: props.src, ...await resolve_cids(heliaProvider.helia.value, props.src) };
    for await (const item of stacFromStore(store, srcinfo.value)) {
        stac_item.value = item;
    }
};

onBeforeMount(update);
watch([() => props.src, heliaProvider?.loading], update);
</script>

<template>
    <div class="navbar">
        <div class="navbar-content">
            <Nav />
        </div>
    </div>
    <PathView v-if="srcinfo?.src" :src="srcinfo?.src as string" :item_cid="srcinfo?.item_cid" />
    <ItemView v-if="stac_item" :item="stac_item" />
    <Animation v-else />
</template>
