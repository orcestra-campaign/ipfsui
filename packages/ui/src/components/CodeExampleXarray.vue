<script lang="ts">
import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
import hljsVuePlugin from "@highlightjs/vue-plugin";

hljs.registerLanguage('python', python);

export default {
    components: {
        highlightjs: hljsVuePlugin.component
    }
}
</script>

<script setup lang="ts">
import { computed } from 'vue';
import { ref } from "vue";
import { Copy, Check, Info } from "lucide-vue-next";


const props = defineProps<{ src: string }>();

const pythonExampleCode = computed(() =>
`import xarray as xr

ds = xr.open_dataset("${props.src}", engine="zarr")
`)

const copied = ref(false);

function copyCode() {
  navigator.clipboard.writeText(pythonExampleCode.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
}

</script>

<template>
  <div class="code-block">
    <div class="code-header">
      <button class="copy-btn">
        <a href="https://orcestra-campaign.org/ipfs.html#accessing-data-with-ipfs" target="_blank" class="icon-link">
          <Info :size="14"/>
        </a>
      </button>
      <button class="copy-btn" @click="copyCode">
        <template v-if="!copied">
          <Copy :size="14"/>
          Copy
        </template>
        <template v-else>
          <Check :size="14"/>
          Copied!
        </template>
      </button>
    </div>
    <highlightjs
      class="codeexample"
      language="python"
      :code="pythonExampleCode"
    />
  </div>
</template>

<style>
@import url("highlight.js/styles/stackoverflow-light.min.css") (prefers-color-scheme: light);
@import url("highlight.js/styles/stackoverflow-dark.min.css") (prefers-color-scheme: dark);

.code-block {
    border: 2px solid var(--highlight-bg-color);
    border-radius: 5px;
    overflow: hidden;
    margin: 5px 0;
    position: relative;
}

.code-header {
    padding: 0.25rem 0.25rem;
    position: absolute;
    top: 0;
    right: 0;
    display: flex;
}

.codeexample {
    margin: 0;
}

.copy-btn {
    font-size: 12px;
    padding: 4px 4px;
    border-radius: 5px;
    transition: background 0.2s;
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.copy-btn:hover {
    border: 1px solid var(--fg-color);
}

.icon-link, .icon-link:hover {
    color: inherit;
}

</style>
