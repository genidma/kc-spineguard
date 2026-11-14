import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const projectId = env.VITE_FIREBASE_PROJECT_ID || 'demo-kc-spineguard';
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      proxy: {
        // Mirrors the Firebase Hosting rewrite in firebase.json (same pattern as kc-rhythm).
        '/api/log-ip': {
          target: `http://127.0.0.1:5001/${projectId}/us-central1/logUserIP`,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/log-ip/, ''),
        },
      },
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    test: {
      include: ['src/**/*.test.ts'],
    },
  };
});
