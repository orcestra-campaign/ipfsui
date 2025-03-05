<script setup>
import { useId } from "vue";

const model = defineModel({type: String});
const id = useId();

</script>

<template>
    <div>
        <label :for="id">search:</label>
        <input :id="id" v-model="model" placeholder="Search..." autofocus type="search" />
    </div>
</template>

<style scoped>
label {
  position: absolute;
  clip: rect(1px, 1px, 1px, 1px);
  padding: 0;
  border: 0;
  height: 1px;
  width: 1px;
  overflow: hidden;
}

input[type="search"] {
    margin: 5px;
    padding: 10px 5px;
    border-style: solid;
    border-width: 1px;
    border-radius: 5px;
    border-color: var(--fg-color);
    width: calc(100% - 10px);
    box-sizing: border-box;
    display: block;
    color: var(--fg-color);
    font-size: larger;
}

input[type="search"]:focus, textarea:focus {
  outline: solid var(--orcestra-yellow);
  outline-offset: 2px;
}
</style>
