import DSContainer from "./components/DSContainer.vue";
import DSIndex from "./components/DSIndex.vue";
import NotFound from "./components/NotFound.vue";
import Privacy from "./components/Privacy.vue";
import RedirectImprint from "./components/RedirectImprint.vue";
import DragDSContainer from "./components/DragDSContainer.vue";

export const routes = [
  { path: "/", component: DSIndex },
  { path: "/imprint", component: RedirectImprint },
  { path: "/privacy", component: Privacy },
  { path: "/ds/:src(.+)", component: DSContainer, props: true },
  { path: "/:catchAll(.*)*", component: NotFound },
  { path: "/local", component: DragDSContainer }
];
