/**
 * Environment Validation — the RUNTIME APP CONFIG contract
 *
 * This module validates ONLY the values the app reads at runtime — a narrow,
 * PM2-style surface (docs/archive/pre-migration-2026-07-18/CODEBASE_ANALYSIS.md
 * §9). Everything else in .env belongs to the other two lifecycle contracts
 * and is owned by tooling, NOT validated here:
 *
 *   runtime app config        — this file; values the app reads via
 *                               process.env (validated below)
 *   long-lived deploy secrets — generated during first-time bootstrap only
 *                               (ensure_framework_env in
 *                               scripts/lib/deploy-env.sh,
 *                               scripts/env-bootstrap.mjs); used only by
 *                               setup/deploy/rotation, never read by the app:
 *                               PM_SETTINGS_ENCRYPTION_KEY, PM_ADMIN_*_PASSWORD,
 *                               DEPLOY_USER_PASSWORD, DEPLOY_SSH_KEY
 *   first-run operator inputs — site facts + deploy transport, collected by
 *                               `npm run setup` or validated by preflight:
 *                               SITE_DOMAIN, SERVER_IP, ACME_EMAIL,
 *                               SERVER_ROOT_PASSWORD, SSH_KEY, PM_DOCKER_*, ...
 *
 * The bootstrap guarantees .env exists before every supported flow, so there
 * are NO soft dev fallbacks here: a missing required value
 * (TOTP_ENCRYPTION_KEY when 2FA is enabled) fails clearly and early in every
 * environment instead of silently degrading.
 */
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().optional(),
  DATABASE_URL: z.string().default('./data/sqlite.db'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // Hard runtime requirement: 2FA secrets are encrypted with this key
  // (bootstrap-generated, keep stable between deploys).
  TOTP_ENCRYPTION_KEY: z.string().min(1),

  // Security / rate limiting
  PM_TRUST_PROXY: z.string().optional(),
  PM_FEATURES_HIBP: z.string().optional(),

  // SMTP (features.contactEmailConfirmation)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  // Virus scanning (fail-open)
  CLAMAV_ENABLED: z.string().optional(),
  CLAMAV_SOCKET: z.string().optional(),

  // Sentry (optional error tracking)
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  SENTRY_RELEASE: z.string().optional(),

  // Build metadata (injected at build/deploy time)
  APP_BUILD_VERSION: z.string().optional(),
  APP_BUILD_SHA: z.string().optional(),
  APP_BUILD_TIMESTAMP: z.string().optional(),

  // PM2 content enrichment (OPT-IN — portfolio fallback sources, see
  // src/lib/server/services/portfolio-pm2-source.ts): the live pulled
  // nikitat.pro snapshot and the legacy metadata snapshot. When set, missing
  // values are validated (string paths); when unset, sparse rows render
  // unchanged and the service warns once so the misconfiguration is visible.
  PM2_SOURCE_DB: z.string().optional(),
  PM2_LEGACY_SOURCE_DB: z.string().optional()
})

export type EnvConfig = z.infer<typeof envSchema>

let _env: EnvConfig | null = null

export function useEnv(): EnvConfig {
  if (!_env) {
    const result = envSchema.safeParse(process.env)
    if (!result.success) {
      console.error('Environment validation failed:', result.error.format())
      // Unified contract: refuse to run with a degraded configuration in
      // every environment. A missing TOTP_ENCRYPTION_KEY here means the env
      // bootstrap did not run (or .env was deleted) — not a dev convenience.
      const missingTotp = result.error.issues.some(issue => issue.path[0] === 'TOTP_ENCRYPTION_KEY')
      const hint = missingTotp
        ? ' TOTP_ENCRYPTION_KEY is not set — run `npm run dev` once to bootstrap .env, or set it in .env (generate with `openssl rand -hex 32`).'
        : ''
      throw new Error(
        `Environment validation failed — refusing to start with a degraded configuration.${hint}`
      )
    }
    _env = result.data
  }
  return _env
}
