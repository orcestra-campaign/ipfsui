<script setup lang="ts">
import { ref } from 'vue';
import DSContainer from './components/DSContainer.vue';
import DummyItem from './components/DummyItem.vue';

const ds_url = ref("http://127.0.0.1:8080/ipns/latest.orcestra-campaign.org/products/HALO/dropsondes/Level_3/PERCUSION_Level_3.zarr")
</script>

<template>
  <div>
    <div>
      <input class="url" v-model="ds_url">
    </div>
    <DSContainer :src="ds_url" />
    <!--<DummyItem />-->
  </div>
</template>

<style scoped>
input.url {
  width: 100%;
}
</style>
