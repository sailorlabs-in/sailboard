import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget =
    env.VITE_PROXY_TARGET ||
    env.API_PROXY_TARGET ||
    env.BACKEND_URL ||
    `http://localhost:${env.PORT || env.API_PORT || 3333}`;

  const port = parseInt(env.VITE_PORT || '5173', 10);

  return {
    plugins: [react()],
    envDir: path.resolve(process.cwd()),
    resolve: {
      alias: {
        '@rea/shared-types': path.resolve(process.cwd(), 'libs/shared-types/src/index.ts'),
      },
    },
    server: {
      port,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '/socket.io': {
          target: proxyTarget,
          ws: true,
          changeOrigin: true,
        },
        '/whiteboard': {
          target: proxyTarget,
          ws: true,
          changeOrigin: true,
        },
      },
    },
  };
});
