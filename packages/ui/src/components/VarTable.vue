<script setup lang="ts">

import { type StacItem } from "@orcestra/utils"
import { VMarkdownView } from 'vue3-markdown'
import 'vue3-markdown/dist/vue3-markdown.css'

const {item} = defineProps<{ item: StacItem }>();
</script>

<template>
  <div class="vartable">
    <div class="row header">
        <div class="col name">Name</div>
        <div class="col unit">Unit</div>
        <div class="col description">Description</div>
    </div>
    <div class="row dim" v-for="[k, v] of Object.entries(item?.properties['cube:dimensions'] || {})">
      <div class="col name">{{ k }}</div>
      <div class="col unit">{{ v.unit }}</div>
      <div class="col description"><VMarkdownView mode="view" :content="v.description" ></VMarkdownView> </div>
    </div>
    <div class="row var" v-for="[k, v] of Object.entries(item?.properties['cube:variables'] || {})">
      <div class="col name">{{ k }} <span class="dimensions">(<span class="dimension" v-for="d of v.dimensions">{{ d }}</span>)</span></div>
      <div class="col unit">{{ v.unit }}</div>
      <div class="col description"><VMarkdownView mode="view" :content="v.description" ></VMarkdownView> </div>
    </div>
  </div>
</template>

<style scoped>
.vartable {
  display: flex;
  flex-direction: column;
}

.row {
  display: flex;
  flex-direction: column;
  padding: 0px;
  vertical-align: middle;
}

.row:nth-child(even) {
  background-color: var(--highlight-bg-color);
}

.header {
  display: none;
}

.col.name:not(div.header *) {
  font-family: 'Menlo', 'Courier New', Courier, monospace;
  font-weight: bold;
  font-size: 13px;
}

@media (width >= 700px) {
  .row {
    flex-direction: row;
    padding: none;
  }

  .col {
    padding: 5px;
  }

  .col.name {
    flex: 0 0 20em;
  }

  .header {
    text-transform: uppercase;
    font-weight: bold;
    display: flex;
  }

  .header .col.name {
    font-family: unset;
  }

  .col.unit {
    flex: 0 0 10em;
  }

  .col.description {
    flex: 1;
  }

  section.markdown-body > * {
     margin: 0;
  }
}

span.dimensions {
  font-weight: 400;
}
span.dimension:nth-last-child(n + 2)::after  {
  content: ",\00a0"
}
</style>
