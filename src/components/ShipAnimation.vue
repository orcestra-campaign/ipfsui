<template>
  <div class="loading-container">
    <div class="island cape-verde float">🏝️</div>
    <div class="ship float">🛥️</div>
    <div class="island barbados float">🏝️</div>
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
  display: inline;
}

.barbados {
  transform: translate(-15vw);
}

.cape-verde {
  transform: translate(15vw);
}

.ship {
  animation: move 32s linear infinite;
}

@keyframes move {
    0% { transform: translate(15vw); }
    100% { transform: translate(-15vw); }
}
</style>
