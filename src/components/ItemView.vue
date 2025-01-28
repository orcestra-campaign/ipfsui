<script setup lang="ts">
import { computed } from 'vue'
import { VMarkdownView } from 'vue3-markdown'
import 'vue3-markdown/dist/style.css'

const props = defineProps<{ item: {} }>();

const code = computed(() => `import xarray as xr

xr.open_dataset("${ props?.item?.assets?.data?.href }", engine="zarr")`)

</script>

<template>
    <div class="head">
        <h1 class="title">{{ props.item.properties?.title }}</h1>
        <div class="authors"><ul><li v-for="contact in props.item.properties?.contacts">{{ contact.name ?? contact.organization }}</li></ul></div>
        <div class="aux">
            <div class="time" v-if="props.item?.properties?.datetime">{{ props.item.properties.datetime }}</div>
            <div class="time" v-if="props.item?.properties?.start_datetime && props.item?.properties?.end_datetime">{{ props.item.properties.start_datetime }} - {{ props.item.properties.end_datetime }}</div>
            <div class="keywords" v-if="props.item?.properties?.keywords"><ul><li v-for="kw in props.item.properties.keywords">{{ kw }}</li></ul></div>
            <div class="license" v-if="props.item?.properties?.license">⚖️ {{ props.item.properties.license }}</div>
        </div>
    </div>

    <div class="summary" v-if="props.item.properties?.description">    
        <VMarkdownView
            mode="view"
            :content="props.item.properties.description"
        ></VMarkdownView>
    </div>

    <div>
        <highlightjs language='python' :code="code" />
    </div>

</template>

<style scoped>
.head {
    background-color: var(--highlight-bg-color);
    border-radius: 3px;
    padding: 5px 15px;
    margin: 0;
}

.authors ul {
    list-style: none;
    margin: 0;
    padding: 0;
}

.authors li {
    display: inline-block;
    margin-right: 15px;
}

.aux {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
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
</style>
