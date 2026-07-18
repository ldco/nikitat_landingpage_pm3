import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  root: process.cwd(),
  test: {
    environment: 'nuxt',
    env: {
      NODE_ENV: 'test',
      PM_MODE: 'build',
      NUXT_PUBLIC_DISABLE_RATE_LIMIT: 'true'
    },
    environmentOptions: {
      nuxt: {
        rootDir: process.cwd(),
        domEnvironment: 'happy-dom'
      }
    },
    // Test files pattern - excludes playwright tests (they use their own runner)
    include: ['tests/**/*.test.ts'],
    exclude: ['e2e-playwright/**', 'node_modules/**'],
    // Global test timeout (increased for e2e tests)
    testTimeout: 90000,
    // Hook timeout for setup/teardown
    hookTimeout: 90000,
    // Coverage configuration
    coverage: {
      provider: 'v8',
      include: [
        'server/utils/**',
        'server/api/**',
        'app/composables/**',
        'app/components/**',
        'pm-core/**/*.ts'
      ],
      exclude: [
        'node_modules',
        'tests',
        'e2e-playwright',
        '**/*.d.ts',
        '**/*.test.ts',
        '.nuxt',
        '.output'
      ],
      // Coverage thresholds - enforced in CI
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 75,
        lines: 80
      },
      // Report formats
      reporter: ['text', 'text-summary', 'json', 'html', 'lcov'],
      // Output directory
      reportsDirectory: './coverage',
      // Enable all files tracking (shows 0% for untested files)
      all: true
    },
    // Global setup/teardown
    globalSetup: [],
    // Reporters
    reporters: ['default']
  }
})
