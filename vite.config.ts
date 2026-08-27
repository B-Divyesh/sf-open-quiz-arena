import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: 'src-web',
  build: { outDir: '../dist', emptyOutDir: true, target: 'es2022' },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:8080', '/health': 'http://localhost:8080', '/ws': { target: 'ws://localhost:8080', ws: true } }
  },
  test: { include: ['../tests-web/**/*.test.ts'] }
});
