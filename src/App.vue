<script setup lang="ts">
import { ref } from 'vue';

import IPFSStatus from './components/IPFSStatus.vue';
import OrcestraLogo from './images/orcestra-logo.svg';

const ds_url = ref("http://127.0.0.1:8080/ipns/latest.orcestra-campaign.org/products/HALO/dropsondes/Level_3/PERCUSION_Level_3.zarr")
</script>

<template>
  <nav>
    <div class="brand"><a href="#/"><OrcestraLogo height="28px" viewBox="0 0 558.77 63"/> Data Browser</a></div>
    <IPFSStatus class="_end" />
  </nav>
  <RouterView />
</template>

<style scoped>
.brand a {
  font-family: Aileron;
  font-weight: 500;
  font-size: 40px;
  color: var(--orcestra-blue);
}

@media (prefers-color-scheme: dark) {
  .brand a {
    color: var(--fg-color);
  }
}
</style>
