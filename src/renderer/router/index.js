import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      redirect: 'read',
    },
    {
      path: '/single',
      name: 'single',
      component: require('@/pages/SingleTagPage').default,
    },
    {
      path: '/read',
      name: 'read',
      component: require('@/pages/ReadTagPage').default,
    },
    {
      path: '/multiple',
      name: 'multiple',
      component: require('@/pages/MultipleTagPage').default,
    },
  ],
});
