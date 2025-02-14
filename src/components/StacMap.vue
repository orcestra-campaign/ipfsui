<script setup lang="ts">

import "leaflet/dist/leaflet.css";
import { LGeoJson, LMap, LTileLayer } from "@vue-leaflet/vue-leaflet";
import { computed, ref, onMounted, onUnmounted } from "vue";

const { item } = defineProps<{ item: StacItem }>();

const style = { color: "var(--line-color)" };

const mapBounds = computed(() => [[item?.bbox[1], item?.bbox[0]], [item?.bbox[3], item?.bbox[2]]]);
const mapCenter = computed(() => [(item?.bbox[1] + item?.bbox[3]) / 2, (item?.bbox[0] + item?.bbox[2]) / 2]);

const map = ref();

const onMapReady = (mapObject) => {
  if (mapObject) {
    // When the map is ready, fit its bounds to item bounds
    mapObject.fitBounds(mapBounds.value);
  }
};

const mediaQuery = window.matchMedia('(prefers-color-scheme : dark)');
const isDarkMode = ref(mediaQuery.matches);

const update = (event) => (isDarkMode.value = event.matches);
onMounted(() => mediaQuery.addEventListener("change", update));
onUnmounted(() => mediaQuery.removeEventListener("change", update));

const url = computed(() => `https://tiles.stadiamaps.com/tiles/alidade_smooth${isDarkMode.value ? '_dark' : ''}/{z}/{x}/{y}{r}.png`);

</script>

<template>
    <div class="map" v-if="item.bbox">
        <LMap ref="map" :center="mapCenter" :use-global-leaflet="false" @ready="onMapReady">
        <LTileLayer
            :url="url"
            layer-type="base"
            name="Stadia Maps"
            attribution='&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
        ></LTileLayer>
        <LGeoJson :geojson="item" :options-style="() => style"/>
        </LMap>
    </div>
</template>

<style>
:root {
  --line-color: var(--orcestra-blue-dark);
}

@media (prefers-color-scheme: dark) {
  :root {
    --line-color: var(--orcestra-yellow);
  }
}
</style>
