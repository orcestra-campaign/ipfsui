<script setup lang="ts">
import { inject } from 'vue';
import { HeliaProviderKey } from '../plugins/HeliaProvider';

const heliaProvider = inject(HeliaProviderKey);

</script>

<template>
    <div class="ipfsstatus">
        <div v-if="heliaProvider?.loading.value">helia is loading</div>
        <div v-if="heliaProvider?.helia.value">helia is available</div>
        <div v-if="heliaProvider?.error.value">helia has an error: {{ heliaProvider?.error.value }}</div>
    </div>
</template>