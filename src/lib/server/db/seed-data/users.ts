/**
 * Users Seed — creates initial admin users when the table is empty.
 *
 * Credentials NEVER have reusable defaults. Every seeded account is
 * bootstrapped from environment variables (PM_ADMIN_MASTER_* / PM_ADMIN_ADMIN_*
 * / PM_ADMIN_USER_*). The npm flows (`npm run db:seed` / `npm run db:reset`)
 * bootstrap .env FIRST (predb:* runs scripts/env-bootstrap.mjs) and pass it to
 * this process via `tsx --env-file=.env`, so the seeded credentials and the
 * generated .env values come from the same source from the first command
 * onward. When the environment does not provide a password:
 *   - local development — a one-time random password is generated and printed
 *     to the console (interactive TTY only, never to log-captured output) so
 *     the developer can log in; it is never persisted anywhere and never
 *     reused. This fallback applies only when the seed runs directly (e.g.
 *     `npx tsx src/lib/server/db/seed.ts`) without a .env. Local resets are
 *     NOT blocked by the project being in 'build' PM_MODE (that mode is a
 *     permanent project config, not a deployment signal).
 *   - production / explicitly enforced environments (NODE_ENV=production or
 *     PM_ADMIN_BOOTSTRAP_ENFORCE=true) — the seed FAILS FAST with the list of
 *     missing keys; the operator must provide credentials (e.g. via
 *     `node scripts/rotate-admin-passwords.mjs --generate --write-env`).
 *
 * Bootstrapped accounts are flagged `must_change_password = true` so the first
 * login forces a password change before normal admin access (login endpoint
 * returns the flag; the admin shell blocks navigation until it is cleared).
 */
import { randomBytes } from 'node:crypto'
import { useDatabase, schema } from '$lib/server/db'
import { hashPassword, validatePassword, DEFAULT_PASSWORD_POLICY } from '$lib/server/auth/password'

interface SeedTarget {
  role: 'master' | 'admin' | 'editor'
  emailKey: string
  passwordKey: string
  defaultEmail: string
  name: string
}

const SEED_TARGETS: SeedTarget[] = [
  {
    role: 'master',
    emailKey: 'PM_ADMIN_MASTER_EMAIL',
    passwordKey: 'PM_ADMIN_MASTER_PASSWORD',
    defaultEmail: 'master@example.com',
    name: 'Developer'
  },
  {
    role: 'admin',
    emailKey: 'PM_ADMIN_ADMIN_EMAIL',
    passwordKey: 'PM_ADMIN_ADMIN_PASSWORD',
    defaultEmail: 'admin@example.com',
    name: 'Client Owner'
  },
  {
    role: 'editor',
    emailKey: 'PM_ADMIN_USER_EMAIL',
    passwordKey: 'PM_ADMIN_USER_PASSWORD',
    defaultEmail: 'editor@example.com',
    name: 'Content Editor'
  }
]

/**
 * Whether the seed must require explicit bootstrap credentials.
 *
 * Keyed on ACTUAL deployment/runtime intent, NOT on the project's static
 * PM_MODE: a project permanently configured as 'build' (production-like
 * config) is still a normal local dev environment for `npm run db:reset`.
 * Enforcement applies in real production (NODE_ENV=production) or when the
 * operator explicitly opts in via PM_ADMIN_BOOTSTRAP_ENFORCE=true.
 */
function shouldEnforceBootstrapCredentials(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.PM_ADMIN_BOOTSTRAP_ENFORCE === 'true'
}

/**
 * Strength-check a configured bootstrap password. Rejects placeholders and
 * weak values (e.g. `replace-with-a-strong-random-password` from .env.example)
 * so the seed can never create a privileged account with a guessable or
 * publicly known credential — `must_change_password` does not protect an
 * account whose current password is already known.
 */
function assertStrongBootstrapPassword(target: SeedTarget, password: string): void {
  const result = validatePassword(password, DEFAULT_PASSWORD_POLICY)
  if (!result.valid) {
    throw new Error(
      `${target.passwordKey} is not strong enough: ${result.errors.join(', ')}. ` +
        'Generate strong random values with: node scripts/rotate-admin-passwords.mjs --generate --write-env'
    )
  }
}

/**
 * Pre-flight gate (called by seed.ts BEFORE any database write). In production
 * or explicitly enforced environments every privileged account MUST have an
 * explicit, strong bootstrap password — otherwise the seed aborts listing every
 * missing/weak key instead of creating accounts with guessable credentials.
 */
export function validateBootstrapCredentials(): void {
  if (!shouldEnforceBootstrapCredentials()) return

  const problems = SEED_TARGETS.map(target => {
    const configured = process.env[target.passwordKey]
    if (!configured) return `${target.passwordKey} is missing`
    const result = validatePassword(configured, DEFAULT_PASSWORD_POLICY)
    if (!result.valid)
      return `${target.passwordKey} is not strong enough (${result.errors.join(', ')})`
    return null
  }).filter((problem): problem is string => problem !== null)

  if (problems.length > 0) {
    throw new Error(
      `Bootstrap credentials invalid in enforced environment: ${problems.join('; ')}. ` +
        'Set them in the environment or generate them with: node scripts/rotate-admin-passwords.mjs --generate --write-env'
    )
  }
}

/** Cryptographically random one-time bootstrap password (never reused). */
function generateBootstrapPassword(): string {
  const groups = [
    'ABCDEFGHJKLMNPQRSTUVWXYZ',
    'abcdefghijkmnopqrstuvwxyz',
    '23456789',
    '!#$%&()*+,-./:;<=>?@[]^_{|}~'
  ]
  const all = groups.join('')
  const chars: string[] = []
  for (const group of groups) {
    const byte = randomBytes(1)[0] ?? 0
    chars.push(group[byte % group.length] ?? '')
  }
  while (chars.length < 24) {
    const byte = randomBytes(1)[0] ?? 0
    chars.push(all[byte % all.length] ?? '')
  }
  for (let i = chars.length - 1; i > 0; i--) {
    const byte = randomBytes(1)[0] ?? 0
    const j = byte % (i + 1)
    const tmp = chars[i] ?? ''
    chars[i] = chars[j] ?? ''
    chars[j] = tmp
  }
  return chars.join('')
}

/** Resolve credentials for one target: env → dev-generated random → fail fast. */
function resolveCredentials(target: SeedTarget): {
  email: string
  password: string
  generated: boolean
} {
  const email = process.env[target.emailKey] || target.defaultEmail
  const configured = process.env[target.passwordKey]

  if (configured && configured.length > 0) {
    // Strength gate applies in EVERY environment (dev included): a configured
    // weak/placeholder password must never seed a privileged account.
    assertStrongBootstrapPassword(target, configured)
    return { email, password: configured, generated: false }
  }

  if (shouldEnforceBootstrapCredentials()) {
    throw new Error(
      `Cannot seed ${target.role} account: ${target.passwordKey} is required in this environment ` +
        `(NODE_ENV=production or PM_ADMIN_BOOTSTRAP_ENFORCE=true). Set ${target.passwordKey} (and optionally ${target.emailKey}) ` +
        'or generate credentials with: node scripts/rotate-admin-passwords.mjs --generate --write-env'
    )
  }

  return { email, password: generateBootstrapPassword(), generated: true }
}

export function seedUsers() {
  const db = useDatabase()
  const existing = db.select().from(schema.users).all()
  if (existing.length > 0) {
    console.log(`   ${existing.length} users exist, skipping.`)
    return
  }

  console.log('👤 Creating users...')
  for (const target of SEED_TARGETS) {
    const { email, password, generated } = resolveCredentials(target)
    db.insert(schema.users)
      .values({
        email,
        passwordHash: hashPassword(password),
        name: target.name,
        role: target.role,
        // First-login hardening: bootstrap credentials must be replaced by the
        // operator on the first login before normal admin access is allowed.
        mustChangePassword: true
      })
      .run()
    if (generated) {
      // One-time dev bootstrap only — printed once because it is not stored
      // anywhere and cannot be recovered otherwise. Only print on an
      // interactive TTY: in CI/log-captured stdout the plaintext credential
      // would persist in logs.
      if (process.stdout.isTTY) {
        console.log(`   ✓ ${email} (${target.role}) — temporary dev password: ${password}`)
        console.log('     Change it on first login. This password is not persisted.')
      } else {
        console.log(
          `   ✓ ${email} (${target.role}) — temporary dev password generated (not shown on non-interactive output)`
        )
      }
    } else {
      console.log(`   ✓ ${email} (${target.role}) — bootstrapped from ${target.passwordKey}`)
    }
  }
  console.log('')
}
