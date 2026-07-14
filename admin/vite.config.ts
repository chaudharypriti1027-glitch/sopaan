import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const adminDir = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.join(adminDir, '..');

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/admin/' : '/',
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      // Single React copy — monorepo hoists 19.0.0 at the repo root.
      react: path.join(monorepoRoot, 'node_modules/react'),
      'react-dom': path.join(monorepoRoot, 'node_modules/react-dom'),
    },
  },
  build: {
    outDir: '../server/public/admin',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        ws: true,
      },
      '/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/admin/login-hint.json': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
}));
