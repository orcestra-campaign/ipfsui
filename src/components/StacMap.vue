<script setup lang="ts">

import "leaflet/dist/leaflet.css";
import { LGeoJson, LMap, LTileLayer } from "@vue-leaflet/vue-leaflet";
import { computed } from "vue";

const { item } = defineProps<{ item: StacItem }>();

const mapBounds = computed(() => [[item?.bbox[1], item?.bbox[0]], [item?.bbox[3], item?.bbox[2]]]);
const mapCenter = computed(() => [(item?.bbox[1] + item?.bbox[3]) / 2, (item?.bbox[0] + item?.bbox[2]) / 2]);
</script>

<template>
    <div class="map" v-if="item.bbox">
        <LMap ref="map" :zoom="3" :center="mapCenter" :use-global-leaflet="false">
        <!--<LMap ref="map" :bounds="mapBounds" :use-global-leaflet="false">-->
        <LTileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            layer-type="base"
            name="OpenStreetMap"
        ></LTileLayer>
        <LGeoJson :geojson="item" />
        </LMap>
    </div>
</template>