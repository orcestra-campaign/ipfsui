<template>
  <div class="loading-container">
    <div class="island float">🏝️</div>
    <div class="balloon float">🎈</div>
  </div>
</template>

<style scoped>
.loading-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.float {
  font-size: 2.6em;
  position: absolute;
}

.balloon {
  animation: move 16s linear infinite;
}

@keyframes move {
  0% { transform: translate(0, 0); }
  100% { transform: translate(-5vw, -25vh); }
}
</style>
