<script setup lang="ts">
</script>

<template>
  <div class="loading-container">
    <div class="flying-plane-container">
      <div class="flying-plane">✈️</div>
    </div>
  </div>
</template>

<style>
:root {
  --radius: min(15vw, 15vh);
}
</style>

<style scoped>

.loading-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.flying-plane-container {
  position: relative;
  font-size: 2.6em;
  animation: move 8s linear infinite;
}

.flying-plane {
  /* offset the rotation of the emoji itself */
  transform: rotate(135deg);
}

@keyframes move {
    0% {
        transform: rotate(0deg) translate(var(--radius));
    }
    25% {
        transform: rotate(90deg) translate(var(--radius));
    }
    50% {
        transform: rotate(180deg) translate(var(--radius));
    }
    75% {
        transform: rotate(270deg) translate(var(--radius));
    }
    100% {
        transform: rotate(360deg) translate(var(--radius));
    }
}
</style>
