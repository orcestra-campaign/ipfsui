import DSContainer from "./components/DSContainer.vue";
import DSIndex from "./components/DSIndex.vue";
import NotFound from "./components/NotFound.vue";

export const routes = [
  { path: "/", component: DSIndex },
  { path: "/ds/:src(.+)", component: DSContainer, props: true },
  { path: "/:catchAll(.*)*", component: NotFound },
];
