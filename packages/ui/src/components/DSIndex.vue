<script setup lang="ts">
import { computed, ref, watchEffect } from "vue";
import { useRoute, useRouter, type LocationQueryValue} from "vue-router";
import indexData from "./data/products_short.json" with {type: "json"};
import SearchBox from "./SearchBox.vue";
import type { ReducedStacItem } from "@orcestra/utils"
import Nav from "./Nav.vue"

const route = useRoute();
const router = useRouter();

console.log("route", route.query);

indexData.sort((a, b) => (!a.properties?.title ? 1 : (!b.properties?.title ? -1 : a.properties.title.localeCompare(b.properties.title))))

function normalizeQueryParameter(q: LocationQueryValue | LocationQueryValue[]): string {
    if (!q) return "";
    if (Array.isArray(q)) {
        return q.join(" ");
    }
    return q;
}

const filter = ref(normalizeQueryParameter(route.query.s));

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
    filter.value = normalizeQueryParameter(route.query.s);
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
        <ul class="stac_listing" v-for="item of filteredIndex">
            <li class="stac_listing">
                <a :href="'#/ds/' + item.assets.data.href">
                <div>
                    <div class="title">{{ item.properties?.title ?? item.assets.data.href }}</div>
                    <ul class="authors"><li v-for="contact in item.properties?.contacts">{{ contact.name }}</li></ul>
                </div>
                </a>
            </li>
        </ul>
    </div>
</template>

<style scoped>

ul {
  list-style-type: none;
  margin: 0;
  padding: 0;
}

ul.stac_listing > li {
    display: block;
    outline: 1px solid var(--fg-color);
    outline-offset: -1px;
    border-radius: 5px;
    margin: 5px;
    padding: 6px;
}

ul.stac_listing > li:hover {
    outline: 2px solid var(--orcestra-yellow);
}

.title {
    font-weight: 700;
}

ul.authors > li {
    display: inline-block;
    margin: 0 .1em;
    font-size: smaller;
    font-weight: 400;
    color: var(--fg-color);
}

ul.authors > li:nth-last-child(n + 3)::after  {
    content: ", "
}

ul.authors > li:nth-last-child(2)::after  {
    content: " and "
}

</style>