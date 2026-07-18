/**
 * TOTP (Time-based One-Time Password) Utilities
 *
 * Two-factor authentication using TOTP (RFC 6238) via otpauth.
 * Includes QR code generation, backup codes, and secret encryption.
 */
import { TOTP, Secret } from 'otpauth'
import QRCode from 'qrcode'
import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from 'node:crypto'

const ENCRYPTION_ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16

function getEncryptionKey(): Buffer {
  const envKey = process.env.TOTP_ENCRYPTION_KEY
  if (envKey) return scryptSync(envKey, 'totp-salt', 32)
  return scryptSync('development-totp-key', 'totp-salt', 32)
}

export function generateTotpSecret(): string {
  const secret = new Secret({ size: 20 })
  return secret.base32
}

function createTotpInstance(secret: string, userEmail: string, issuer?: string): TOTP {
  return new TOTP({
    issuer: issuer || 'Puppet Master',
    label: userEmail,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secret)
  })
}

export async function generateTotpQRCode(secret: string, userEmail: string, issuer?: string): Promise<string> {
  const totp = createTotpInstance(secret, userEmail, issuer)
  return QRCode.toDataURL(totp.toString(), {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 256
  })
}

export function verifyTotpCode(secret: string, code: string, userEmail: string): boolean {
  const totp = createTotpInstance(secret, userEmail)
  const delta = totp.validate({ token: code, window: 1 })
  return delta !== null
}

export function generateBackupCodes(): { plain: string[]; hashed: string[] } {
  const codes: string[] = []
  const hashedCodes: string[] = []

  for (let i = 0; i < 10; i++) {
    const code = randomBytes(4).toString('hex').toUpperCase()
    codes.push(code)
    const hash = scryptSync(code, 'backup-code-salt', 32).toString('hex')
    hashedCodes.push(hash)
  }

  return { plain: codes, hashed: hashedCodes }
}

export function verifyBackupCode(code: string, hashedCodes: string[]): number {
  const normalizedCode = code.toUpperCase().replace(/[\s-]/g, '')
  const codeHash = scryptSync(normalizedCode, 'backup-code-salt', 32).toString('hex')
  return hashedCodes.findIndex(hash => hash === codeHash)
}

export function encryptTotpSecret(secret: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv)

  let encrypted = cipher.update(secret, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decryptTotpSecret(encryptedSecret: string): string {
  const key = getEncryptionKey()
  const parts = encryptedSecret.split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted secret format')

  const [ivHex, authTagHex, encrypted] = parts
  const iv = Buffer.from(ivHex!, 'hex')
  const authTag = Buffer.from(authTagHex!, 'hex')

  const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted!, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

export interface TwoFactorVerifyResult {
  success: boolean
  method?: 'totp' | 'backup'
  backupCodeIndex?: number
  error?: string
}

export function verify2faCode(
  code: string,
  encryptedSecret: string,
  hashedBackupCodes: string[],
  userEmail: string
): TwoFactorVerifyResult {
  const normalizedCode = code.replace(/[\s-]/g, '')

  if (/^\d{6}$/.test(normalizedCode)) {
    const secret = decryptTotpSecret(encryptedSecret)
    if (verifyTotpCode(secret, normalizedCode, userEmail)) {
      return { success: true, method: 'totp' }
    }
    return { success: false, error: 'Invalid verification code' }
  }

  const backupIndex = verifyBackupCode(normalizedCode, hashedBackupCodes)
  if (backupIndex >= 0) {
    return { success: true, method: 'backup', backupCodeIndex: backupIndex }
  }

  return { success: false, error: 'Invalid verification code' }
}
