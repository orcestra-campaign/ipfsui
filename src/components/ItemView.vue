<script setup lang="ts">
import { computed } from 'vue'
import { VMarkdownView } from 'vue3-markdown'
import 'vue3-markdown/dist/style.css'

import License from './License.vue';
import VarTable from './VarTable.vue';
import type { StacItem } from '../utils/stac';
import StacMap from './StacMap.vue';

const {item} = defineProps<{ item: StacItem }>();

const code = computed(() => `import xarray as xr

xr.open_dataset("${ item?.assets?.data?.href }", engine="zarr")`)

</script>

<template>
    <div class="head">
        <h1 class="title">{{ item.properties?.title }}</h1>
        <div class="aux">
            <div class="col">
                <div class="authors"><ul><li v-for="contact in item.properties?.contacts">{{ contact.name ?? contact.organization }}</li></ul></div>
                <div class="time" v-if="item?.properties?.start_datetime && item?.properties?.end_datetime">{{ item.properties.start_datetime }} - {{ item.properties.end_datetime }}</div>
                <div class="time" v-else-if="item?.properties?.datetime">{{ item.properties.datetime }}</div>
                <div class="keywords" v-if="item?.properties?.keywords"><ul><li v-for="kw in item.properties.keywords">{{ kw }}</li></ul></div>
            </div>
            <div class="col"><License :spdx="item?.properties?.license" /></div>
        </div>
    </div>

    <div class="description">
        <div class="summary" v-if="item.properties?.description">
            <VMarkdownView
                mode="view"
                :content="item.properties.description"
            ></VMarkdownView>
        </div>
        <StacMap :item="item" />
    </div>

    <div>
        <highlightjs language='python' :code="code" />
    </div>

    <h2>Parameter(s)</h2>
    <div>
        <VarTable :item="item" />
    </div>

    <div v-if="item?.properties?.references">
        <h2>References:</h2>
        <div class="references"><ul><li v-for="ref in item.properties?.references">{{ ref }}</li></ul></div>
    </div>

</template>

<style scoped>
.head {
    background-color: var(--highlight-bg-color);
    border-bottom-left-radius: 5px;
    border-bottom-right-radius: 5px;
    padding: 5px 15px;
    margin: 0;
}

.authors ul {
    list-style: none;
    margin: 0;
    padding: 0;
    font-weight: bolder;
}

.authors li {
    display: inline-block;
    margin-right: 15px;
}

.aux {
    display: flex;
    justify-content: space-between;
}

.aux .col {
    display: flex;
    flex-direction: column;
    justify-content: end;
}

.keywords ul {
    list-style: none;
    margin: 0;
    padding: 0;
}

.keywords li {
    display: inline-block;
    margin: 3px;
    padding: 3px 5px;
    border-radius: 3px;
    background-color: lightgreen;
}

.description {
    display: flex;
    gap: 5px;
}

@media (width <= 800px) {
    .description {
        flex-direction: column;
    }
}

.summary {
    flex: 10 10 auto;
}

.map {
    max-width: 100%;
    /*width: 400px;*/
    height: 300px;
    flex: 1 1 400px;
    margin: 5px 0;
}
</style>
