
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'android' ? './' : '/Project-Companion/',
  server: {
    proxy: {
      '/api/chat': {
        target: 'http://127.0.0.1:11434',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/chat/, '/api/chat')
      }
    }
  }
}));
