import App from "./App.vue";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import VueCodeHighlight from "vue-code-highlight";

import { createApp } from "vue";
import { ko, en } from "vuetify/locale";
import { createI18n, useI18n } from "vue-i18n";
import { createVuetify } from "vuetify";
import { createVueI18nAdapter } from "vuetify/locale/adapters/vue-i18n";

import "vuetify/styles";
import "./assets/main.css";
import "@mdi/font/css/materialdesignicons.css";

const messages = {
  en: {
    $vuetify: {
      ...en,
      dataIterator: {
        rowsPerPageText: "Items per page:",
        pageText: "{0}-{1} of {2}",
      },
    },
  },
  ko: {
    $vuetify: {
      ...ko,
      dataIterator: {
        rowsPerPageText: "Element per sida:",
        pageText: "{0}-{1} av {2}",
      },
    },
  },
};

const i18n = createI18n({
  legacy: false, // Vuetify does not support the legacy mode of vue-i18n
  locale: "ko",
  fallbackLocale: "ko",
  messages,
});

const vuetify = createVuetify({
  components,
  directives,
  locale: {
    adapter: createVueI18nAdapter({ i18n, useI18n }),
  },
});

const app = createApp(App);

app.use(i18n);
app.use(vuetify);
app.use(VueCodeHighlight);
app.mount("#app");
