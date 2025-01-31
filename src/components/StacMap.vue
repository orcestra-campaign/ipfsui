<script setup lang="ts">

import "leaflet/dist/leaflet.css";
import { LGeoJson, LMap, LTileLayer } from "@vue-leaflet/vue-leaflet";
import { computed, ref } from "vue";

const { item } = defineProps<{ item: StacItem }>();

const mapBounds = computed(() => [[item?.bbox[1], item?.bbox[0]], [item?.bbox[3], item?.bbox[2]]]);
const mapCenter = computed(() => [(item?.bbox[1] + item?.bbox[3]) / 2, (item?.bbox[0] + item?.bbox[2]) / 2]);

const map = ref();

const onMapReady = (mapObject) => {
  if (mapObject) {
    // When the map is ready, fit its bounds to item bounds
    mapObject.fitBounds(mapBounds.value);
  }
};

</script>

<template>
    <div class="map" v-if="item.bbox">
        <LMap ref="map" :center="mapCenter" :use-global-leaflet="false" @ready="onMapReady">
        <LTileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            layer-type="base"
            name="OpenStreetMap"
        ></LTileLayer>
        <LGeoJson :geojson="item" />
        </LMap>
    </div>
</template>