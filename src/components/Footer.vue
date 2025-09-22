<script setup lang="ts">
import MaxPlanckLogo from '../images/mpg-minerva.svg';
</script>

<template>
    <div class="footer">
        <div class="footer-content">
            <div class="left"></div>
            <div class="center"></div>
            <div class="right"><MaxPlanckLogo height="72px" viewBox="0 0 113.5 113.4"/></div>
        </div>
    </div>
</template>

<style scoped>
.footer {
  width: 100vw;
  margin-left: calc((100% - 100vw) / 2);
  border-top: solid 1px gray;
}

.footer-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 10px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
