<script setup lang="ts">

import { computed } from "vue";

const {spdx} = defineProps<{ spdx: string }>();

const licenseImage = computed(() =>
  spdx.startsWith('CC-BY-NC-SA') ? '/src/images/by-nc-sa.svg' :
  spdx.startsWith('CC-BY-NC') ? '/src/images/by-nc.svg' :
  spdx.startsWith('CC-BY-SA') ? '/src/images/by-sa.svg' :
  spdx.startsWith('CC-BY') ? '/src/images/by.svg' :
  spdx.startsWith('CC0') ? '/src/images/cc-zero.svg' : null
)
</script>

<template>
  <div v-if="spdx">
    <img v-if="licenseImage" class="license" :src="licenseImage" :alt="spdx">
    <span v-else>⚖️ {{ spdx }}</span>
  </div>
</template>

<style scoped>
img.license {
    width: 88px;
}
</style>
