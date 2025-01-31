<script setup lang="ts">
import { useHelia } from '../plugins/HeliaProvider';
import IpfsLogo from './images/ipfs-logo.svg';

const {loading, helia, error, inBrowser} = useHelia();
</script>

<template>
    <div class="ipfsstatus">
        <IpfsLogo width="1.3em" height="1.3em" viewBox="0 0 169 196" style="vertical-align: bottom; display: inline-block;"/> IPFS
        <span v-if="loading" class="tooltip left" data-tip="loading">⏳</span>
        <span v-if="helia" class="tooltip left" data-tip="available">✅</span>
        <span v-if="error" class="tooltip left" :data-tip="error">❌</span>
        <input type="checkbox" v-model="inBrowser" class="tooltip left" data-tip="use in-browser IPFS implementation" />
    </div>
</template>

<style scoped>
.tooltip {
  position:relative; /* making the .tooltip span a container for the tooltip text */
}

.tooltip:before {
  content: attr(data-tip); /* here's the magic */
  position:absolute;
  
  /* vertically center */
  top:50%;
  transform:translateY(-50%);
  
  /* move to right */
  left:100%;
  margin-left:15px; /* and add a small left margin */
  
  /* basic styles */
  padding: 0 5px;
  border-radius:5px;
  background: var(--bg-color);
  color: var(--fg-color);
  border-color: var(--hightlight-bg-color);
  border-width: 1px;
  border-style: solid;
  text-align:center;

  display:none; /* hide by default */
}

.tooltip:hover:before {
  display:block;
}

.tooltip.left:before {
  /* reset defaults */
  left:initial;
  margin:initial;

  /* set new values */
  right:100%;
  top: 100%;
  margin-right:15px;
  margin-top:15px;
}
</style>