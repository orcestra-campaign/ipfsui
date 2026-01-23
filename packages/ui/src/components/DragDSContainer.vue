<script setup lang="ts">
import { shallowRef, type ShallowRef, useId } from 'vue'

import Nav from './Nav.vue';
import ItemView from './ItemView.vue';
import { genStacFromStore } from '@orcestra/utils';
import type { DatasetSrc } from '@orcestra/utils';

const dropId = useId();

const srcinfo: ShallowRef<DatasetSrc | undefined> = shallowRef();

const stac_item = shallowRef();
const isDragging = shallowRef(false);

class FSDESStore {
  root: FileSystemDirectoryEntry;

  constructor(root: FileSystemDirectoryEntry) {
    this.root = root;
  }
  async get(key: string) {
    const root = this.root;
    try {
      const res = (await (new Promise<FileSystemEntry>((resolve, reject) => {
        root.getFile(key.slice(1), {}, resolve, reject)
      })));
      if (!res.isFile) {
        return undefined;
      }
      const file = await (new Promise<File>((resolve, reject) => {
        (res as FileSystemFileEntry).file(resolve, reject)
      }));
      return new Uint8Array(await file.arrayBuffer());
    } catch {
      return undefined;
    }
  }
};

const dragOver = (ev: DragEvent) => {
  ev.preventDefault();  // necessary to allow drop
};

const dragEnter = () => {
  isDragging.value = true;
};

const dragLeave = () => {
  isDragging.value = false;
};

const drop = async (ev: DragEvent) => {
  ev.preventDefault();
  isDragging.value = false;
  const item = ev?.dataTransfer?.items[0];
  if (item === null || item === undefined) {
    srcinfo.value = undefined;
    stac_item.value = undefined;
    return;
  }
  const entry = item.webkitGetAsEntry();
  if (entry === null || entry === undefined || !entry.isDirectory) {
    srcinfo.value = undefined;
    stac_item.value = undefined;
    return;
  }
  const store = new FSDESStore(entry as FileSystemDirectoryEntry);
  srcinfo.value = {src: entry.name};
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
    <div :id="dropId" class="dropzone" :class="{dragover: isDragging}" @dragover="dragOver" @dragenter="dragEnter" @dragleave="dragLeave" @drop="drop">drop datasets here</div>
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
