/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import { execSync } from 'node:child_process'

// Build stamp shown in the footer and sent with feedback: date + short commit,
// so every pilot report can be tied to the exact deployed version.
function buildVersion(): string {
  const date = new Date().toISOString().slice(0, 10)
  let sha = process.env.GITHUB_SHA?.slice(0, 7)
  if (!sha) {
    try {
      sha = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim()
    } catch {
      sha = 'local'
    }
  }
  return `${date}-${sha}`
}

// base './' makes the build relocatable (works at any GitHub Pages subpath
// because routing uses the hash router).
export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(buildVersion()),
  },
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
