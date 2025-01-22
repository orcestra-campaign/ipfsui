import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";

import { routes } from "./routes.ts";
import { createRouter, createWebHashHistory } from "vue-router";

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

createApp(App).use(router).mount("#app");
