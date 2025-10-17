import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";

import { routes } from "./routes.ts";
import { createRouter, createWebHashHistory } from "vue-router";
import HeliaProvider from "./plugins/HeliaProvider.ts";

import { registry } from "zarrita";
import { DeltaCodec } from "@orcestra/utils";

// @ts-expect-error DeltaCodec only handles numbers, but I didn't yet figure out how to check this properly
registry.set("delta", () => DeltaCodec);

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

createApp(App).use(HeliaProvider).use(router).mount("#app");
