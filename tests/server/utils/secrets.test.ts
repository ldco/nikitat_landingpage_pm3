import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  decryptSecretValue,
  encryptSecretValue,
  isEncryptedSecretValue,
  validateSettingsEncryptionKeyValue
} from '../../../server/utils/secrets'

beforeEach(() => {
  vi.stubEnv('PM_SETTINGS_ENCRYPTION_KEY', 'a'.repeat(64))
})

afterEach(() => vi.unstubAllEnvs())

describe('settings secrets', () => {
  it('encrypts with enc:v1 envelope prefix', () => {
    const encrypted = encryptSecretValue('telegram-token')
    expect(encrypted.startsWith('enc:v1:')).toBe(true)
    expect(isEncryptedSecretValue(encrypted)).toBe(true)
  })

  it('decrypts encrypted values back to original plaintext', () => {
    const encrypted = encryptSecretValue('sensitive-value')
    expect(decryptSecretValue(encrypted)).toBe('sensitive-value')
  })

  it('keeps legacy plaintext values readable', () => {
    expect(decryptSecretValue('legacy-plaintext')).toBe('legacy-plaintext')
    expect(isEncryptedSecretValue('legacy-plaintext')).toBe(false)
  })
})

describe('settings encryption key validation', () => {
  it('accepts a literal 64-character hexadecimal key', () => {
    const key = 'a'.repeat(64)
    expect(validateSettingsEncryptionKeyValue(key)).toBeNull()
  })

  it('rejects the documented placeholder value', () => {
    expect(
      validateSettingsEncryptionKeyValue('replace-with-64-character-hex-string-from-openssl')
    ).toContain('real generated secret')
  })

  it('rejects shell command substitution stored as dotenv data', () => {
    expect(validateSettingsEncryptionKeyValue('$(openssl rand -hex 32)')).toContain(
      'literal secret value'
    )
  })

  it('rejects invalid explicit keys before encrypting settings', () => {
    vi.stubEnv('PM_SETTINGS_ENCRYPTION_KEY', 'not-a-valid-production-key')
    expect(() => encryptSecretValue('secret')).toThrow(/64 characters/)
  })
})
