import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";

import { routes } from "./routes.ts";
import { createRouter, createWebHashHistory } from "vue-router";
import HeliaProvider from "./plugins/HeliaProvider.ts";
import "highlight.js/styles/stackoverflow-light.css";
import hljs from "highlight.js/lib/core";
import python from "highlight.js/lib/languages/python";
import hljsVuePlugin from "@highlightjs/vue-plugin";

hljs.registerLanguage("python", python);

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

createApp(App).use(HeliaProvider).use(router).use(hljsVuePlugin).mount("#app");
