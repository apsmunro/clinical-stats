/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'

// base './' makes the build relocatable (works at any GitHub Pages subpath
// because routing uses the hash router).
export default defineConfig({
  base: './',
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 5174,
  },
  plugins: [
    { enforce: 'pre', ...mdx({ jsxImportSource: 'react' }) },
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
  ],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1500, // plotly.js basic bundle is large but lazy-loaded
  },
  test: {
    environment: 'node',
    include: ['src/test/**/*.test.ts'],
  },
})
