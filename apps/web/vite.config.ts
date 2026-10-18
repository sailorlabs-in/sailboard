import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@rea/shared-types': path.resolve(process.cwd(), 'libs/shared-types/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3333',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3333',
        ws: true,
        changeOrigin: true,
      },
      '/whiteboard': {
        target: 'http://localhost:3333',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
