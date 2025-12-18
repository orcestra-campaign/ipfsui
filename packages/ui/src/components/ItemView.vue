<script setup lang="ts">
import { computed } from 'vue'
import { VMarkdownView } from 'vue3-markdown'
import 'vue3-markdown/dist/vue3-markdown.css'
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useHead } from '@unhead/vue';

import License from './License.vue';
import VarTable from './VarTable.vue';
import type { StacItem } from '@orcestra/utils';
import StacMap from './StacMap.vue';

import ItemAccess from './ItemAccess.vue';

dayjs.extend(utc);

const {item} = defineProps<{ item: StacItem }>();

function formatDatestring(iso?: string | null): { iso: string, fmt: string } | null {
    if (!iso) {
        return null;
    } else {
        return { iso, fmt: dayjs(iso).utc().format('YYYY-MM-DDTHH:mm:ss[Z]') };
    }
}
const start_datetime = computed(() => formatDatestring(item?.properties?.start_datetime));
const end_datetime = computed(() => formatDatestring(item?.properties?.end_datetime));
const datetime = computed(() => formatDatestring(item?.properties?.datetime));

function parseReferences(references: string[]): {text: string, url?: string}[] {
  return references.map(text => {
    if (text.match('^https?://')) {
      return {text, url: text};
    } else if (text.match(/^10\.\d+\//)) {
      return {text, url: `https://doi.org/${text}`};
    }
    return {text};
  });
}
const references = computed(() => parseReferences(item.properties?.references ?? []));

function abbreviateName(name: string): string {
  // Trim and normalize whitespace
  const cleanName = name.trim().replace(/\s+/g, " ");

  let firstName = "";
  let lastName = "";

  if (cleanName.includes(",")) {
    // Case: "Doe, John"
    const parts = cleanName.split(",").map(p => p.trim());
    lastName = parts[0];
    firstName = parts[1]?.split(" ")[0] || "";
  } else {
    // Case: "John Doe"
    const parts = cleanName.split(" ");
    firstName = parts[0];
    lastName = parts[parts.length - 1];
  }

  if (!firstName || !lastName) {
    return name; // fallback if input is malformed
  }

  // Format name as `Doe, J.`
  return `${lastName}, ${firstName[0]}.`;
}


function createCitation(item: StacItem): string {
  const authors: string = item.properties.contacts
    ?.map((c: { name: string }) => abbreviateName(c.name))
    .join(", ") ?? "Unknown author";

  const year: string = "2025"; // TODO: extract from DOI/attributes
  const title: string = item.properties.title ?? "Untitled";
  const url: string = item.assets.data.href; // TODO: replace with DOI if available

  return `${authors}. (${year}). ${title}. ${url}`;
}
const citation = computed(() => createCitation(item));

useHead({
  link: [
    {
      rel: "schema.DC",
      href: "http://purl.org/dc/elements/1.1/",
    },
  ],
  meta: [
    {
      name: "DC.identifier",
      content: item.assets.data.href, // TODO: replace with DOI if available
    },
  ],
})

</script>

<template>
    <div class="head">
        <h1 class="title">{{ item.properties?.title }}</h1>
        <div class="aux">
            <div class="col">
                <div class="authors"><ul><li v-for="contact in item.properties?.contacts">
                    <a v-if="contact?.emails?.[0]?.value" class="hidden-link" :href="'mailto:' + contact.emails[0].value + '?subject=' + item.properties?.title">
                        {{ contact.name }}
                    </a>
                    <span v-else>
                        {{ contact.name }}
                    </span>
                </li></ul></div>
                <div class="time" v-if="start_datetime && end_datetime">
                    <time :datetime="start_datetime.iso">{{ start_datetime.fmt }}</time> to
                    <time :datetime="end_datetime.iso">{{ end_datetime.fmt }}</time>
                </div>
                <div class="time" v-else-if="datetime">
                    <time :datetime="datetime.iso">{{ datetime.fmt }}</time>
                </div>
                <div class="keywords" v-if="item?.properties?.keywords"><ul><li v-for="kw in item.properties.keywords"><RouterLink class="hidden-link" :to="'/?s=' + kw">{{ kw }}</RouterLink></li></ul></div>
            </div>
            <div class="col"><License v-if="item?.properties?.license" :spdx="item.properties.license" /></div>
        </div>
    </div>

    <div class="description">
        <div class="summary" v-if="item.properties?.description">
            <VMarkdownView
                mode="view"
                :content="item.properties.description"
            ></VMarkdownView>
        </div>
        <StacMap :item="item" />
    </div>

    <ItemAccess :item="item" />

    <div v-if="item?.properties['cube:dimensions'] || item?.properties['cube:variables']">
        <h2>Parameter(s)</h2>
        <VarTable :item="item" />
    </div>

    <h2>Cite as</h2>
    <div class="citation">{{ citation }}</div>

    <div v-if="item?.properties?.references">
        <h2>References:</h2>
        <div class="references">
            <ul>
                <li v-for="({text, url}) in references">
                    <a v-if="url" :href="url">{{ text }}</a>
                    <div v-else>{{ text }}</div>
                </li>
            </ul>
        </div>
    </div>

</template>

<style scoped>
.head {
    background-color: var(--highlight-bg-color);
    border-bottom-left-radius: 5px;
    border-bottom-right-radius: 5px;
    padding: 5px 15px;
    margin: 0;
}

.title {
  font-family: "Roboto Slab";
  font-size: 42px;
  line-height: 1.1;
  letter-spacing: -0.25px;
  margin: 0.5em 0;
}

.authors ul {
    list-style: none;
    margin: 0;
    padding: 0;
    font-weight: bolder;
}

.authors li {
    display: inline-block;
    margin-right: 15px;
}

.aux {
    display: flex;
    justify-content: space-between;
}

.aux .col {
    display: flex;
    flex-direction: column;
    justify-content: end;
}

.keywords ul {
    list-style: none;
    margin: 0;
    padding: 0;
}

.keywords li {
    background-color: var(--orcestra-blue-faint);
    border: 1px solid var(--orcestra-blue-dark);
    border-radius: 2em;
    color: var(--orcestra-blue-dark);
    display: inline-block;
    font-size: 12px;
    font-weight: 500;
    line-height: 22px;
    margin: 3px 6px 3px 0;
    padding: 0 10px;
    white-space: nowrap;
}

.keywords li:hover {
    background-color: var(--orcestra-blue-dark);
    color: white;
}

@media (prefers-color-scheme: dark) {
    .keywords li {
        background-color: transparent;
        border: 1px solid var(--orcestra-yellow);
        color: var(--orcestra-yellow);
    }

    .keywords li:hover {
        background-color: var(--orcestra-yellow);
        color: var(--highlight-bg-color);
    }
}

.description {
    display: flex;
    gap: 5px;
}

.summary {
    flex: 10 10 auto;
}

.citation {
  border-left: 3px solid var(--orcestra-yellow);
  padding: 0.5rem 1rem;
}

.map {
    max-width: 100%;
    height: 300px;
    flex: 1 1 400px;
    margin: 5px 0;
}

@media (width <= 800px) {
    .description {
        flex-direction: column;
    }

    .map {
        flex: 1 1 300px;
    }
}
</style>
