<script setup lang="ts">

import { computed } from "vue";
import ccByNcSaLogo from '../images/by-nc-sa.svg';
import ccByNcLogo from '../images/by-nc.svg';
import ccBySaLogo from '../images/by-sa.svg';
import ccByLogo from '../images/by.svg';
import ccZeroLogo from '../images/cc-zero.svg';

const {spdx} = defineProps<{ spdx: string }>();

</script>

<template>
  <div v-if="spdx">
    <div v-if="spdx.startsWith('CC-BY-NC-SA')"><ccByNcSaLogo viewBox="0 0 120 42" class="license"/></div>
    <div v-else-if="spdx.startsWith('CC-BY-NC')"><ccByNcLogo viewBox="0 0 120 42" class="license"/></div>
    <div v-else-if="spdx.startsWith('CC-BY-SA')"><ccBySaLogo viewBox="0 0 120 42" class="license"/></div>
    <div v-else-if="spdx.startsWith('CC-BY-')"><ccByLogo viewBox="0 0 120 42" class="license"/></div>
    <div v-else-if="spdx.startsWith('CC0-')"><ccZeroLogo viewBox="0 0 88 31" class="license"/></div>
    <span v-else>⚖️ {{ spdx }}</span>
  </div>
</template>

<style scoped>
.license {
  width: 88px;
  vertical-align: bottom;
  display: inline-block;
}
</style>
