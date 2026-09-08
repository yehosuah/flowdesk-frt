import { createApp } from 'vue';

import App from '@/app/App.vue';
import router from '@/app/router';
import { appStore } from '@/stores/app.store';

import '@/styles/tokens.css';
import '@/styles/theme.css';
import '@/styles/globals.css';
import '@/styles/useTheme';

appStore.hydrate();

createApp(App).use(router).mount('#app');
