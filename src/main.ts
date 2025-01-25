import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";

import { routes } from "./routes.ts";
import { createRouter, createWebHashHistory } from "vue-router";
import HeliaProvider from "./plugins/HeliaProvider.ts";

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

createApp(App).use(HeliaProvider).use(router).mount("#app");
