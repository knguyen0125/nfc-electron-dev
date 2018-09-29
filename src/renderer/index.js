'use strict';

import Vue from 'vue';
import Vuetify from 'vuetify';

import App from '@/App';
import router from '@/router';

Vue.use(Vuetify);

new Vue({
  components: { App },
  template: '<App />',
  router,
}).$mount('#app');
