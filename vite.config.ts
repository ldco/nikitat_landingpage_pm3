import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { paraglide } from '@inlang/paraglide-sveltekit/vite'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

// Unified env contract: the framework reads env through process.env (PM3
// parity), but Vite only exposes .env via import.meta.env / $env by default.
// Load .env into process.env at config time (dev, build and test) so every
// flow observes the same values the bootstrap wrote into .env
// (scripts/env-bootstrap.mjs, ensure_framework_env in scripts/lib/deploy-env.sh).
// Real process.env values (e.g. CI-injected secrets) always win.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) process.env[key] = value
  }

  return {
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
        $lib: '/src/lib',
        $app: '/tests/__mocks__/$app'
      }
    }
  }
})
