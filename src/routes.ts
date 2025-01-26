import DSContainer from "./components/DSContainer.vue";
import DummyItem from "./components/DummyItem.vue";
import NotFound from "./components/NotFound.vue";

export const routes = [
  { path: "/", component: DummyItem },
  { path: "/ds/:src(.+)", component: DSContainer, props: true },
  { path: "/:catchAll(.*)*", component: NotFound },
];
