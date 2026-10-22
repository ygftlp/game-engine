import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      'lite-game-engine': resolve(__dirname, '../../dist/lib/index.mjs'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});