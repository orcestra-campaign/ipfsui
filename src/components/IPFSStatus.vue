<script setup lang="ts">
import { inject } from 'vue';
import { HeliaProviderKey } from '../plugins/HeliaProvider';
import IpfsLogo from './images/ipfs-logo.svg';

const heliaProvider = inject(HeliaProviderKey);

</script>

<template>
    <div class="ipfsstatus">
        <IpfsLogo width="1.3em" height="" viewBox="0 0 169 196" style="vertical-align: bottom; display: inline-block;"/> IPFS
        <span v-if="heliaProvider?.loading.value" title="loading">⏳</span>
        <span v-if="heliaProvider?.helia.value" title="available">✅</span>
        <span v-if="heliaProvider?.error.value" :title="heliaProvider?.error.value">❌</span>
    </div>
</template>