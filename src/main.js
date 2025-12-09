import App from './App.vue';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import VueCodeHighlight from 'vue-code-highlight';

import { createApp } from 'vue';
import { createVuetify } from 'vuetify';

import 'vuetify/styles';
import './assets/main.css';
import '@mdi/font/css/materialdesignicons.css';

const vuetify = createVuetify({
  components,
  directives,
});

const app = createApp(App);
app.use(vuetify);
app.use(VueCodeHighlight);
app.mount('#app');
