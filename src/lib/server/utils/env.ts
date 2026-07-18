/**
 * Environment Validation — Zod-validated env vars
 */
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().default('./data/sqlite.db'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // Auth
  SESSION_SECRET: z.string().optional(),
  TOTP_ENCRYPTION_KEY: z.string().optional(),

  // SMTP
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  // Admin
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),

  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),

  // URLs
  PUBLIC_SITE_URL: z.string().optional(),
})

export type EnvConfig = z.infer<typeof envSchema>

let _env: EnvConfig | null = null

export function useEnv(): EnvConfig {
  if (!_env) {
    const result = envSchema.safeParse(process.env)
    if (!result.success) {
      console.error('Environment validation failed:', result.error.format())
      _env = envSchema.parse({}) // Use defaults
    } else {
      _env = result.data
    }
  }
  return _env
}
