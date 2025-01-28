<script setup lang="ts">
import { computed, ref } from "vue";
import indexData from "./data/meteor_products_items.json" with {type: "json"};
import JsonViewer from 'vue-json-viewer'
import 'vue-json-viewer/style.css'

console.log(indexData);

const filter = ref("");

function nestedSome(o: unknown, f: (_: string) => Boolean): Boolean {
    if ( typeof o === "string" ) {
        return f(o);
    } else if ( typeof o === "object" ) {
        return Object.entries(o as Object).some(([k, v]) => nestedSome(k, f) || nestedSome(v, f));
    } else {
        return false;
    }
}

const filteredIndex = computed(() => {
    if( filter.value.length > 0 ) {
        const queries = filter.value.toLowerCase().split(" ").map(e => e.trim());
        return indexData.filter(e => {
            return queries.every(q => {
                return nestedSome(e.properties, x => x.toLowerCase().includes(q));
            });
        });
    } else {
        return indexData;
    }
});
</script>

<template>
    <label>search: 
        <input v-model="filter" />
    </label>
    <ul class="stac_listing">
        <li v-for="item of filteredIndex">
            <a :href="'#/ds/' + item.assets.data.href">{{ item.properties.title }}</a>
            <ul class="authors"><li v-for="contact in item.properties?.contacts">{{ contact.name ?? contact.organization }}</li></ul>
        </li>
    </ul>
</template>

<style scoped>

ul {
  list-style-type: none;
  margin: 0;
  padding: 0;
}

ul.stac_listing > li {
    display: block;

    border-style: solid;
    border-color: var(--fg-color);
    border-width: 1px;
    border-radius: 5px;
    margin: 5px;
    padding: 5px;
}

ul.authors > li {
    display: inline-block;
    margin: 0 .1em;
}

ul.authors > li:nth-last-child(n + 3)::after  {
    content: ", "
}

ul.authors > li:nth-last-child(2)::after  {
    content: " and "
}

</style>