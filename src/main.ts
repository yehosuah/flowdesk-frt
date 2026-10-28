
import { createApp } from 'vue';

import App from '@/app/App.vue';
import router from '@/app/router';
import { appStore } from '@/stores/app.store';
import { i18n } from '@/i18n';
import { hydrateLocale } from '@/i18n/useLocale';

import '@/styles/tokens.css';
import '@/styles/theme.css';
import '@/styles/globals.css';
import '@/styles/useTheme';

// Recuperar la sesión del usuario.
appStore.hydrate();

// SCRUM-768:
// Recuperar el idioma antes de montar la aplicación.
hydrateLocale();

createApp(App)
  .use(i18n)
  .use(router)
  .mount('#app');
