import DSContainer from './components/DSContainer.vue';
import DummyItem from './components/DummyItem.vue';

export const routes = [
  { path: '/', component: DummyItem },
  { path: '/ds/:src(.+)', component: DSContainer, props: true },
]