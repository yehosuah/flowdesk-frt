
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const proxyTarget = env.VITE_PROXY_TARGET?.trim();

  return {
    plugins: [vue()],

    // Conservar los logos PNG utilizados por FlowDesk.
    assetsInclude: ['**/*.PNG'],

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },

    // Mantener el proxy seguro de SCRUM-730 y SCRUM-731.
    server: {
      proxy: proxyTarget
        ? {
            '/api': {
              target: proxyTarget,
              changeOrigin: true,
            },
          }
        : {},
    },

    preview: {
      host: '0.0.0.0',
      port: 4173,
    },

    test: {
      globals: true,
      environment: 'jsdom',
    },
  };
});
