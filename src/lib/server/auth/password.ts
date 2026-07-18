/**
 * Password Utilities
 *
 * Secure password hashing using Node.js native scrypt.
 * Includes password policy enforcement and strength calculation.
 */
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto'

const SALT_LENGTH = 16
const KEY_LENGTH = 64

const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '123456', '12345678', '123456789',
  'qwerty', 'abc123', 'letmein', 'welcome', 'monkey', 'dragon', 'master',
  'admin', 'login', 'passw0rd', 'hello', 'sunshine', 'princess', 'football',
  'baseball', 'iloveyou', 'trustno1', 'superman', 'batman', 'shadow', 'michael',
  'ashley', 'daniel', 'jessica', 'charlie', 'thomas', 'robert', 'jennifer'
])

export interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecial: boolean
  rejectCommon: boolean
}

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecial: true,
  rejectCommon: true
}

export interface PasswordValidationResult {
  valid: boolean
  errors: string[]
  strength: 'weak' | 'fair' | 'good' | 'strong'
  score: number
}

export function validatePassword(
  password: string,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY
): PasswordValidationResult {
  const errors: string[] = []
  let score = 0
  const specialCharRegex = /[^A-Za-z0-9]/

  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters`)
  } else {
    score += 1
    if (password.length >= 12) score += 1
    if (password.length >= 16) score += 1
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  } else if (/[A-Z]/.test(password)) {
    score += 1
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  } else if (/[a-z]/.test(password)) {
    score += 1
  }

  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  } else if (/\d/.test(password)) {
    score += 1
  }

  if (policy.requireSpecial && !specialCharRegex.test(password)) {
    errors.push('Password must contain at least one special character')
  } else if (specialCharRegex.test(password)) {
    score += 1
  }

  if (policy.rejectCommon) {
    const lowerPassword = password.toLowerCase()
    if (COMMON_PASSWORDS.has(lowerPassword)) {
      errors.push('Password is too common')
      score = Math.max(0, score - 2)
    }
  }

  const charTypes = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    specialCharRegex.test(password)
  ].filter(Boolean).length

  if (charTypes === 4) score += 1
  if (!/(.)\1{2,}/.test(password)) score += 1

  let strength: 'weak' | 'fair' | 'good' | 'strong'
  if (score <= 3) strength = 'weak'
  else if (score <= 5) strength = 'fair'
  else if (score <= 7) strength = 'good'
  else strength = 'strong'

  return {
    valid: errors.length === 0,
    errors,
    strength,
    score: Math.min(10, score)
  }
}

export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '!@#$%^&*()_+-='
  const all = uppercase + lowercase + numbers + special
  const allBytes = Buffer.from(all, 'utf-8')

  let password = ''
  const ensure = [uppercase, lowercase, numbers, special]
  for (const chars of ensure) {
    password += chars[randomBytes(1)[0]! % chars.length]!
  }

  for (let i = password.length; i < length; i++) {
    password += String.fromCharCode(allBytes[randomBytes(1)[0]! % allBytes.length]!)
  }

  const chars = password.split('')
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomBytes(1)[0]! % (i + 1)
    const tmp = chars[i]!
    chars[i] = chars[j]!
    chars[j] = tmp
  }

  return chars.join('')
}

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LENGTH).toString('hex')
  const hash = scryptSync(password, salt, KEY_LENGTH).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(':')
    if (!salt || !hash) return false
    const hashBuffer = Buffer.from(hash!, 'hex')
    const suppliedHashBuffer = scryptSync(password, salt!, KEY_LENGTH)
    return timingSafeEqual(hashBuffer, suppliedHashBuffer)
  } catch {
    return false
  }
}

export function generateSessionId(): string {
  return randomBytes(32).toString('hex')
}
