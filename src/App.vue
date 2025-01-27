<script setup lang="ts">
import { ref } from 'vue';

import IPFSStatus from './components/IPFSStatus.vue'

const ds_url = ref("http://127.0.0.1:8080/ipns/latest.orcestra-campaign.org/products/HALO/dropsondes/Level_3/PERCUSION_Level_3.zarr")
</script>

<template>
  <nav>
    <div class="brand">ORCESTRA Data Browser</div>
    <IPFSStatus class="_end" />
  </nav>
  <RouterView />
</template>

<style scoped>
.brand {
  font-weight: bold;
  font-size: 2em;
}
</style>
