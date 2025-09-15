<script setup lang="ts">
import IPFSStatus from './IPFSStatus.vue';
import OrcestraLogo from '../images/orcestra-logo.svg';
</script>

<template>
  <nav>
    <div class="brand"><a href="#/"><OrcestraLogo height="28px" viewBox="0 0 558.77 63"/> Data Browser</a></div>
    <IPFSStatus class="_end" />
  </nav>
</template>

<style scoped>
.brand a {
  font-family: Aileron;
  font-weight: 500;
  font-size: 40px;
  color: var(--orcestra-blue-dark);
  display: block;
  line-height: 1;
  padding-top: 10px;
  padding-bottom: 10px;
}

@media (prefers-color-scheme: dark) {
  .brand a {
    color: var(--fg-color);
  }
}
</style>