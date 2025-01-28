<script setup lang="ts">

import { type StacItem } from "../utils/stac.ts"

const {item} = defineProps<{ item: StacItem }>();
</script>

<template>
  <div>
    <table>
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Unit</th>
          <th scope="col">Description</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="[k, v] of Object.entries(item?.properties['cube:dimensions'])"><th class="dim" scope="row"><pre>{{ k }}</pre></th><td>{{ v.unit }}</td><td>{{ v.description }}</td></tr>
        <tr v-for="[k, v] of Object.entries(item?.properties['cube:variables'])"><th scope="row"><pre>{{ k }}</pre></th><td>{{ v.unit }}</td><td>{{ v.description }}</td></tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
table {
  table-layout: fixed;
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

thead {
  text-transform: uppercase;
}
thead th:nth-child(1) {
  width: 20%;
}

thead th:nth-child(2) {
  width: 20%;
}

th, td {
  padding: 5px 5px;
}

tbody tr:nth-child(odd) {
  background-color: var(--highlight-bg-color);
}

pre {
  margin: 0 0;
}
</style>
