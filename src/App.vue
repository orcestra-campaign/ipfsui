<script setup lang="ts">
import { ref } from 'vue';

const ds_url = ref("http://127.0.0.1:8080/ipns/latest.orcestra-campaign.org/products/HALO/dropsondes/Level_3/PERCUSION_Level_3.zarr")
</script>

<template>
  <div>
    <!--
    <div>
      <input class="url" v-model="ds_url">
    </div>
    -->
    <!--<DSContainer :src="ds_url" />-->
    <!--<DummyItem />-->
    <div>
      <ul>
        <li><a href="#/ds/http://127.0.0.1:8080/ipns/latest.orcestra-campaign.org/products/HALO/dropsondes/Level_3/PERCUSION_Level_3.zarr">DS L3</a></li>
        <li><a href="#/ds/http://127.0.0.1:8080/ipns/latest.orcestra-campaign.org/products/METEOR/GNSS_IWV.zarr">GNSS IWV</a></li>
      </ul>
    </div>
    <RouterView />
  </div>
</template>

<style scoped>
input.url {
  width: 100%;
}
</style>
