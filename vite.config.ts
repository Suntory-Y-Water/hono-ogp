import build from '@hono/vite-build/cloudflare-workers';
import adapter from '@hono/vite-dev-server/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import honox from 'honox/vite';
import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  define: {
    'import.meta.vitest': false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app'),
    },
  },
  build: {
    rollupOptions: {
      external: ['cloudflare:workers'],
    },
  },
  ssr: {
    external: ['cloudflare:workers', 'unicode-trie', 'linebreak', 'satori'],
  },
  plugins: [
    honox({
      devServer: { adapter },
      client: { input: ['./app/style.css'] },
    }),
    tailwindcss(),
    build(),
  ],
});
