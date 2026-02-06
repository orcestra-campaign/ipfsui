import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import { createHead } from '@unhead/vue/client';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';

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
  async scrollBehavior(to, _from, _savedPosition) {
    if (to.hash) {
      const el = document.querySelector(to.hash);
      if (el) {
        el.classList.add("highlight");
        setTimeout(() => {
          el.classList.remove("highlight");
        }, 1000);
      }
      return {
        el: to.hash,
        behavior: 'smooth',
        top: 100,  // keep some distance to top because of navbar
      };
    }
    return { top: 0 };
  },
});


const head = createHead();

const app = createApp(App);

app.use(PrimeVue, {
  theme: {
    preset: Aura,
  }
});

//app.use(PrimeVue, { unstyled: true });
app.use(HeliaProvider);
app.use(router);
app.use(head);
app.mount("#app");
