<script setup lang="ts">
import Footer from './components/Footer.vue'
</script>

<template>
  <div id="app">
    <main>
      <RouterView />
    </main>
    <Footer />
  </div>
</template>

<style>
html, body, #app {
  height: 100%;
}

#app {
  display: flex;
  flex-direction: column;
}

main {
  flex: 1; /* push footer down */
}
</style>
