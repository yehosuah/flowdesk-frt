
import { createApp } from 'vue';

import App from '@/app/App.vue';
import router from '@/app/router';
import { appStore } from '@/stores/app.store';
import { i18n } from '@/i18n';

import '@/styles/tokens.css';
import '@/styles/theme.css';
import '@/styles/globals.css';
import '@/styles/useTheme';

appStore.hydrate();

createApp(App)
  .use(i18n)
  .use(router)
  .mount('#app');
