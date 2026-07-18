import { afterEach, describe, expect, it, vi } from 'vitest'

const ORIGINAL_ENV = { ...process.env }

async function loadFreshEnvUtils() {
  vi.resetModules()
  return import('../../../server/utils/env')
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.resetModules()
  vi.unstubAllEnvs()
})

describe('environment validation', () => {
  it('defaults DATABASE_URL to the project-local SQLite path', async () => {
    delete process.env.DATABASE_URL

    const { validateEnv, env } = await loadFreshEnvUtils()

    expect(() => validateEnv()).not.toThrow()
    expect(env.DATABASE_URL).toBe('./data/sqlite.db')
  })

  it('accepts a bare SMTP_FROM email address', async () => {
    vi.stubEnv('SMTP_FROM', 'hello@example.com')

    const { validateEnv, env } = await loadFreshEnvUtils()

    expect(() => validateEnv()).not.toThrow()
    expect(env.SMTP_FROM).toBe('hello@example.com')
  })

  it('accepts a display-name SMTP_FROM address for Nodemailer', async () => {
    vi.stubEnv('SMTP_FROM', 'Your Site Name <hello@example.com>')

    const { validateEnv, env } = await loadFreshEnvUtils()

    expect(() => validateEnv()).not.toThrow()
    expect(env.SMTP_FROM).toBe('Your Site Name <hello@example.com>')
  })

  it('rejects invalid SMTP_FROM values', async () => {
    vi.stubEnv('SMTP_FROM', 'Your Site Name <not-an-email>')

    const { validateEnv } = await loadFreshEnvUtils()

    expect(() => validateEnv()).toThrow(/SMTP_FROM: Invalid email address/)
  })
})
