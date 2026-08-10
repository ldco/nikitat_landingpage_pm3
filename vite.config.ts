import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { paraglide } from '@inlang/paraglide-sveltekit/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    paraglide({
      project: './project.inlang',
      outdir: './src/lib/paraglide'
    })
  ],
  ssr: {
    // clamscan is an OPTIONAL runtime dependency (audit I-2 virus scanning),
    // not installed by default — externalize so the server build does not try
    // to resolve it. The scanner degrades to fail-open when it is absent.
    external: ['clamscan']
  },
  build: {
    // audit N-13: production build tuning — modern target and a chunk-size
    // warning threshold so bundle regressions surface during `npm run build`.
    target: 'es2022',
    chunkSizeWarningLimit: 500
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    alias: {
      '$lib': '/src/lib',
      '$app': '/tests/__mocks__/$app'
    }
  }
})
