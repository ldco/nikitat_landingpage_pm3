import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import svelte from 'eslint-plugin-svelte'
import svelteParser from 'svelte-eslint-parser'
import ssrSafety from './eslint-plugin-ssr-safety.js'

const s5 = {
  $state: 'readonly', $derived: 'readonly', $effect: 'readonly',
  $props: 'readonly', $bindable: 'readonly', $inspect: 'readonly',
  $host: 'readonly', $$props: 'readonly', $$restProps: 'readonly', $$slots: 'readonly'
}

export default [
  { ignores: ['**/node_modules/**','**/.svelte-kit/**','**/.nuxt/**','**/build/**','**/.output/**','**/dist/**','**/coverage/**','**/data/**','**/public/**','**/.tausik/**','**/.nocowboy/**','**/package-lock.json','**/tsconfig.tsbuildinfo','**/src/lib/paraglide/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended.map(c => ({ ...c, files: ['**/*.ts'] })),
  {
    files: ['**/*.svelte'],
    processor: 'svelte/svelte',
    languageOptions: {
      parser: svelteParser,
      parserOptions: { parser: tseslint.parser, ecmaVersion: 'latest', sourceType: 'module', extraFileExtensions: ['.svelte'] },
      globals: s5
    },
    plugins: { 'svelte': svelte, 'ssr-safety': ssrSafety, '@typescript-eslint': tseslint.plugin },
    rules: {
      // audit N-7: PM3 SSR-safety rule — client components must not import server-only modules
      'ssr-safety/no-server-imports-in-client': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': ['error', { 'ts-ignore': true, 'ts-expect-error': true, 'ts-nocheck': true }],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      'no-unused-vars': 'off', 'no-undef': 'off',
      // Powers `<!-- eslint-disable-next-line -->` comment directives in templates
      'svelte/comment-directive': 'error',
      'svelte/no-at-html-tags': 'warn',
      'svelte/no-navigation-without-resolve': 'off'
    }
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
      globals: { ...s5, process: 'readonly', console: 'readonly', Buffer: 'readonly' }
    },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': ['error', { 'ts-ignore': true, 'ts-expect-error': true, 'ts-nocheck': true }],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      'no-unused-vars': 'off', 'no-console': 'off', 'no-undef': 'off'
    }
  },
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 'latest', sourceType: 'module',
      globals: { process: 'readonly', console: 'readonly', module: 'readonly', require: 'readonly', __dirname: 'readonly', __filename: 'readonly', exports: 'readonly' }
    },
    rules: { 'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }] }
  },
  {
    files: ['scripts/**/*.ts'],
    rules: { '@typescript-eslint/no-require-imports': 'off' }
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts', '**/tests/**/*.ts'],
    rules: { '@typescript-eslint/no-non-null-assertion': 'off', '@typescript-eslint/no-explicit-any': 'off' }
  }
]
