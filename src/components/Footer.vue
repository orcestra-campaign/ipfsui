<script setup lang="ts">
import MaxPlanckLogo from '../images/mpg-minerva.svg';
</script>

<template>
    <footer>
        <div class="footer-content">
            <div class="left"></div>
            <div class="center"></div>
            <div class="right"><MaxPlanckLogo class="logo"/></div>
        </div>
    </footer>
</template>

<style scoped>
footer {
  width: 100vw;
  margin-left: calc((100% - 100vw) / 2);
  border-top: solid 1px gray;
  margin-top: 10px;
}

.footer-content {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  margin: 12px;
  height: 72px;
  width: 72px;
}

.left {
  text-align: left;
}

.center {
  text-align: center;
}

.right {
  text-align: right;
}
</style>
