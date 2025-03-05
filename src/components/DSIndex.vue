<script setup lang="ts">
import { computed, ref, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";
import indexData from "./data/products_short.json" with {type: "json"};
import SearchBox from "./SearchBox.vue";
import type { ReducedStacItem } from "../utils/stac.ts"
import Nav from "./Nav.vue"

const route = useRoute();
const router = useRouter();

console.log("route", route.query);

indexData.sort((a, b) => (!a.properties?.title ? 1 : (!b.properties?.title ? -1 : a.properties.title.localeCompare(b.properties.title))))

const filter = ref(route.query.s || "");

function nestedSome(o: unknown, f: (_: string) => Boolean): Boolean {
    if ( typeof o === "string" ) {
        return f(o);
    } else if ( typeof o === "object" ) {
        return Object.entries(o as Object).some(([k, v]) => nestedSome(k, f) || nestedSome(v, f));
    } else {
        return false;
    }
}

const filteredIndex = computed((): ReducedStacItem[] => {
    if( filter.value.length > 0 ) {
        const queries = filter.value.toLowerCase().split(" ").map(e => e.trim());
        return indexData.filter(e => {
            return queries.every(q => {
                return nestedSome(e.properties, x => x.toLowerCase().includes(q));
            });
        }) as unknown as ReducedStacItem[];
    } else {
        return indexData as unknown as ReducedStacItem[];
    }
});

watchEffect(() => {
    router.replace({ query: { s: filter.value }});
});

watchEffect(() => {
    filter.value = route.query.s || "";
});
</script>

<template>
    <div class="navbar">
        <div class="navbar-content">
            <Nav />
            <SearchBox v-model="filter" />
        </div>
    </div>
    <div class="search_results">
        <ul class="stac_listing">
            <li v-for="item of filteredIndex">
                <a :href="'#/ds/' + item.assets.data.href">{{ item.properties?.title ?? item.assets.data.href }}</a>
                <ul class="authors"><li v-for="contact in item.properties?.contacts">{{ contact.name ?? contact.organization }}</li></ul>
            </li>
        </ul>
    </div>
</template>

<style scoped>

a {
    font-weight: 700;
}

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
    font-size: smaller;
}

ul.authors > li:nth-last-child(n + 3)::after  {
    content: ", "
}

ul.authors > li:nth-last-child(2)::after  {
    content: " and "
}

</style>