import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/Project-Companion/',
  plugins: [react()],
  server: {
    proxy: {
      '/api/chat': {
        target: 'http://127.0.0.1:11434',
        changeOrigin: true
      }
    }
  }
});