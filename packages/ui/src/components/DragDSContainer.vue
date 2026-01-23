<script setup lang="ts">
import { shallowRef, watch, onBeforeMount, type ShallowRef, useId } from 'vue'

import Nav from './Nav.vue';
import ItemView from './ItemView.vue';
import { genStacFromStore } from '@orcestra/utils';
import type { DatasetSrc } from '@orcestra/utils';

const dropId = useId();

const srcinfo: ShallowRef<DatasetSrc | undefined> = shallowRef();

const stac_item = shallowRef();

class FSDESStore {
  constructor(root) {
    this.root = root;
  }
  async get(key, options = {}) {
    console.log("get", key);
    const root = this.root;
    console.log(root);
    try {
      const res = await (new Promise((resolve, reject) => {
        root.getFile(key.slice(1), {}, resolve, reject)
      }));
      const file = await (new Promise((resolve, reject) => {
        res.file(resolve, reject)
      }));
      return await file.bytes();
    } catch {
      return undefined;
    }
  }
};

const dragOver = (ev) => {
  ev.preventDefault();  // necessary to allow drop
};

const dragEnter = (ev) => {
  if (event.target.classList.contains("dropzone")) {
    event.target.classList.add("dragover");
  }
};

const dragLeave = (ev) => {
  if (event.target.classList.contains("dropzone")) {
    event.target.classList.remove("dragover");
  }
};

const drop = async (ev) => {
  ev.preventDefault();
  if (event.target.classList.contains("dropzone")) {
    event.target.classList.remove("dragover");
  }
  const item = ev.dataTransfer.items[0].webkitGetAsEntry();
  const store = new FSDESStore(item);
  srcinfo.value = {src: item.name};
  for await (const item of genStacFromStore(store, srcinfo.value)) {
      stac_item.value = item;
  }
};

</script>

<template>
    <div class="navbar">
        <div class="navbar-content">
            <Nav />
        </div>
    </div>
    <div :id="dropId" class="dropzone" @dragover="dragOver" @dragenter="dragEnter" @dragleave="dragLeave" @drop="drop">drop datasets here</div>
    <ItemView v-if="stac_item" :item="stac_item" />
</template>

<style>
.dropzone {
    height: 100px;
    width: 100%;
    background-color: orange;
}

.dropzone.dragover {
    background-color: yellow;
}
</style>
