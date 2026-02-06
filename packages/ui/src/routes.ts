import DSContainer from "./components/DSContainer.vue";
import DSIndex from "./components/DSIndex.vue";
import NotFound from "./components/NotFound.vue";
import Privacy from "./components/Privacy.vue";
import About from "./components/About.vue";
import RedirectImprint from "./components/RedirectImprint.vue";

export const routes = [
  { path: "/", component: DSIndex },
  { path: "/imprint", component: RedirectImprint },
  { path: "/privacy", component: Privacy },
  { path: "/about", component: About },
  { path: "/ds/:src(.+)", component: DSContainer, props: true },
  { path: "/:catchAll(.*)*", component: NotFound },
];
