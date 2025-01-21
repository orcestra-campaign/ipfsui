<script setup lang="ts">

const props = defineProps<{ attrs: {} }>();

</script>

<template>
    <table>
        <caption>{{ attrs.title }}</caption>
        <tr><th>name</th><th>value</th></tr>
        <tr v-for="(value, key) in props.attrs"><td class="key">{{ key }}</td><td class="value">{{ value }}</td></tr>
    </table>
</template>

<style scoped>
table {
    background-color: beige;
}
th, td {
    text-align: left;
}

.key {
    font-weight: bold;
}

.value {
    font-family: monospace;
}
</style>