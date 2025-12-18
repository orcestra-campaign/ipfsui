<script setup lang="ts">
import { computed } from 'vue';
import type { StacItem } from '@orcestra/utils';

import CodeExampleXarray from './CodeExampleXarray.vue';

import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';

const {item} = defineProps<{ item: StacItem }>();

const src = computed(() => item?.assets?.data?.href);
const is_zarr = computed(() => src && item?.assets?.data?.type === 'application/vnd+zarr');
const is_ipfs = computed(() => src && src.value.match(/^ip[fn]s:\/\//));
const ipfs_path = computed(() => is_ipfs.value && src.value.replace(/^(ip[fn]s):\/\/(.+)$/, "/$1/$2"));
const alternate_gateways = [
  { name: "in-browser", url: "https://inbrowser.link" },
  { name: "public", url: "https://ipfs.io" },
  { name: "local", url: "http://127.0.0.1:8080" },
]


const default_tab = computed(() => {
  if (is_zarr.value) return "zarr-python";
  if (is_ipfs.value) return "gateway";
  return "http";
})

console.log(default_tab.value)
console.log(item)

</script>
<template>
    <Tabs :value="default_tab">
        <TabList>
            <div class="p-tab">Access:</div>
            <Tab value="zarr-python" v-if="is_zarr" pt>Python</Tab>
            <Tab value="ipfs" v-if="is_ipfs">IPFS</Tab>
            <Tab value="gateway" v-if="is_ipfs">HTTP Gateway</Tab>
            <Tab value="http" v-if="!is_ipfs">HTTP</Tab>
        </TabList>
        <TabPanels>
            <TabPanel value="zarr-python" v-if="is_zarr">
                <CodeExampleXarray :src="item.assets.data.href" />
            </TabPanel>
            <TabPanel value="ipfs" v-if="is_ipfs">
                <p>
                Access through IPFS via <code><a :href="item.assets.data.href">{{ item.assets.data.href }}</a></code>.
                </p>
            </TabPanel>
            <TabPanel value="gateway" v-if="is_ipfs">
                <p>
                    You can access the dataset through <strong><a :href="'https://ipfs.orcestra-campaign.org' + ipfs_path">the ORCESTRA IPFS Gateway</a></strong>.
                </p>
                <p class="less-important">
                    If this doesn't work for you, there are other possible gateways you might want to try: <ul class="inline"><li v-for="{name, url} in alternate_gateways"><a :href="url + ipfs_path">{{ name }}</a></li></ul>.
                </p>
            </TabPanel>
            <TabPanel value="http" v-if="!is_ipfs">
                <a :href="item.assets.data.href">{{ item.assets.data.href }}</a>
            </TabPanel>
        </TabPanels>
    </Tabs>
</template>
