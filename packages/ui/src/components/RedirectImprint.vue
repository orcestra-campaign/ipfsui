<template>
  <div>Redirecting to <a href="https://www.mpimet.mpg.de/en/imprint">Max Planck Institute for Meteorology imprint</a>...</div>
</template>

<script setup>
import { onMounted } from "vue";

onMounted(() => {
  window.location.replace("https://www.mpimet.mpg.de/en/imprint");
});
</script>
