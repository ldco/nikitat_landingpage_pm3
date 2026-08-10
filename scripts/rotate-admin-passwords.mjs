#!/usr/bin/env node
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { Buffer } from 'node:buffer'
import { createRequire } from 'node:module'

const DEFAULT_ENV_FILE = '.env'
const DEFAULT_DB_PATH = './data/sqlite.db'
const PASSWORD_LENGTH = 32
const SALT_LENGTH = 16
const KEY_LENGTH = 64

const targets = [
  {
    label: 'master',
    role: 'master',
    emailKey: 'PM_ADMIN_MASTER_EMAIL',
    passwordKey: 'PM_ADMIN_MASTER_PASSWORD',
    defaultEmail: 'master@example.com'
  },
  {
    label: 'admin',
    role: 'admin',
    emailKey: 'PM_ADMIN_ADMIN_EMAIL',
    passwordKey: 'PM_ADMIN_ADMIN_PASSWORD',
    defaultEmail: 'admin@example.com'
  },
  {
    label: 'user',
    role: 'editor',
    emailKey: 'PM_ADMIN_USER_EMAIL',
    passwordKey: 'PM_ADMIN_USER_PASSWORD',
    defaultEmail: 'editor@example.com'
  }
]

function parseArgs(argv) {
  const options = {
    envFile: DEFAULT_ENV_FILE,
    dbPath: '',
    length: PASSWORD_LENGTH,
    generate: false,
    writeEnv: false,
    apply: false,
    dryRun: false
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    switch (arg) {
      case '--generate':
        options.generate = true
        break
      case '--write-env':
        options.writeEnv = true
        break
      case '--apply':
        options.apply = true
        break
      case '--dry-run':
        options.dryRun = true
        break
      case '--env-file':
        options.envFile = requireValue(argv, index, arg)
        index += 1
        break
      case '--db':
        options.dbPath = requireValue(argv, index, arg)
        index += 1
        break
      case '--length':
        options.length = Number(requireValue(argv, index, arg))
        index += 1
        break
      case '--help':
        printHelp()
        process.exit(0)
        break
      default:
        fail(`Unknown option: ${arg}`)
    }
  }

  if (!options.generate && !options.writeEnv && !options.apply) {
    fail('Specify at least one action: --generate, --write-env, or --apply.')
  }

  if (!Number.isInteger(options.length) || options.length < 20) {
    fail('--length must be an integer of at least 20.')
  }

  return options
}

function requireValue(argv, index, arg) {
  const value = argv[index + 1]
  if (!value || value.startsWith('--')) {
    fail(`${arg} requires a value.`)
  }
  return value
}

function printHelp() {
  console.log(`Usage:
  node scripts/rotate-admin-passwords.mjs --generate --write-env --apply
  node scripts/rotate-admin-passwords.mjs --apply --db /app/data/sqlite.db

Options:
  --generate        Generate new strong passwords for master/admin/user targets.
  --write-env       Write PM_ADMIN_* credentials to the local env file.
  --apply           Hash configured credentials into SQLite and invalidate sessions.
  --dry-run         Validate targets without writing env or database changes.
  --env-file PATH   Env file to read/write. Default: .env
  --db PATH         SQLite DB path. Default: DATABASE_URL or ./data/sqlite.db
  --length N        Generated password length. Default: 32, minimum: 20`)
}

function fail(message) {
  console.error(`[admin-passwords] ERROR: ${message}`)
  process.exit(1)
}

function loadEnvFile(filePath) {
  const env = {}
  if (!fs.existsSync(filePath)) {
    return env
  }

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue

    const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue

    env[match[1]] = stripEnvQuotes(match[2].trim())
  }

  return env
}

function stripEnvQuotes(value) {
  if (value.length < 2) return value
  const first = value[0]
  const last = value[value.length - 1]
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return value.slice(1, -1).replace(/'\\''/g, "'")
  }
  return value
}

function quoteEnv(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`
}

function upsertEnvFile(filePath, values, dryRun) {
  const keys = new Set(Object.keys(values))
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : ''
  const lines = existing ? existing.split(/\r?\n/) : []
  const seen = new Set()
  const nextLines = lines.map(line => {
    const match = line.match(/^(\s*(?:export\s+)?)([A-Za-z_][A-Za-z0-9_]*)(\s*=).*/)
    if (!match || !keys.has(match[2])) {
      return line
    }

    seen.add(match[2])
    return `${match[1]}${match[2]}${match[3]}${quoteEnv(values[match[2]])}`
  })

  const missing = Object.keys(values).filter(key => !seen.has(key))
  if (missing.length > 0) {
    if (nextLines.length > 0 && nextLines[nextLines.length - 1] !== '') {
      nextLines.push('')
    }
    nextLines.push('# Admin bootstrap credentials. Local-only; do not commit.')
    for (const key of missing) {
      nextLines.push(`${key}=${quoteEnv(values[key])}`)
    }
  }

  if (dryRun) {
    console.log(`[admin-passwords] dry-run: would update ${filePath}`)
    return
  }

  fs.writeFileSync(filePath, `${nextLines.join('\n').replace(/\n+$/, '')}\n`, { mode: 0o600 })
  fs.chmodSync(filePath, 0o600)
}

function generatePassword(length) {
  const groups = [
    'ABCDEFGHJKLMNPQRSTUVWXYZ',
    'abcdefghijkmnopqrstuvwxyz',
    '23456789',
    '!#$%&()*+,-./:;<=>?@[]^_{|}~'
  ]
  const all = groups.join('')
  const chars = groups.map(group => group[randomInt(group.length)])

  while (chars.length < length) {
    chars.push(all[randomInt(all.length)])
  }

  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1)
    ;[chars[index], chars[swapIndex]] = [chars[swapIndex], chars[index]]
  }

  return chars.join('')
}

function randomInt(max) {
  return crypto.randomBytes(4).readUInt32BE(0) % max
}

function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex')
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex')
  return `${salt}:${hash}`
}

/**
 * True when `password` matches the stored `salt:hash` value. Used to make
 * rotation idempotent: a deploy whose configured credential is unchanged
 * must NOT re-hash, force another password change, or invalidate sessions.
 */
function passwordMatches(storedHash, password) {
  try {
    const [salt, hash] = String(storedHash).split(':')
    if (!salt || !hash) return false
    const expected = Buffer.from(hash, 'hex')
    const actual = crypto.scryptSync(password, salt, KEY_LENGTH)
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual)
  } catch {
    return false
  }
}

function validatePassword(password, key) {
  const errors = []
  if (password.length < 20) errors.push('must be at least 20 characters')
  if (!/[A-Z]/.test(password)) errors.push('must include uppercase')
  if (!/[a-z]/.test(password)) errors.push('must include lowercase')
  if (!/\d/.test(password)) errors.push('must include a number')
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('must include a special character')

  if (errors.length > 0) {
    fail(`${key} is not strong enough: ${errors.join(', ')}.`)
  }
}

function databaseConstructor() {
  const runtimePackageJson = '/app/package.json'
  const requireFrom = fs.existsSync(runtimePackageJson)
    ? createRequire(runtimePackageJson)
    : createRequire(import.meta.url)

  return requireFrom('better-sqlite3')
}

function resolveDbPath(options, env) {
  const value = options.dbPath || env.DATABASE_URL || process.env.DATABASE_URL || DEFAULT_DB_PATH
  return path.isAbsolute(value) ? value : path.resolve(process.cwd(), value)
}

function buildCredentials(options, env) {
  const credentials = {}
  credentials.PM_ADMIN_PASSWORD_ROTATION_ENABLED = 'true'

  for (const target of targets) {
    credentials[target.emailKey] =
      env[target.emailKey] || process.env[target.emailKey] || target.defaultEmail
    credentials[target.passwordKey] = options.generate
      ? generatePassword(options.length)
      : env[target.passwordKey] || process.env[target.passwordKey] || ''
  }

  return credentials
}

function validateCredentials(credentials) {
  for (const target of targets) {
    const email = credentials[target.emailKey]
    const password = credentials[target.passwordKey]

    if (!email || !email.includes('@')) {
      fail(`${target.emailKey} must be a valid email address.`)
    }
    if (!password) {
      fail(`${target.passwordKey} is required. Use --generate or set it in the env file.`)
    }
    validatePassword(password, target.passwordKey)
  }
}

function applyPasswords(dbPath, credentials, dryRun) {
  if (!fs.existsSync(dbPath)) {
    fail(`SQLite database not found: ${dbPath}`)
  }

  const Database = databaseConstructor()
  const db = new Database(dbPath)

  try {
    const findByEmail = db.prepare('SELECT id, email, role, password_hash FROM users WHERE lower(email) = lower(?)')
    const findByRole = db.prepare('SELECT id, email, role, password_hash FROM users WHERE role = ? ORDER BY id LIMIT 1')
    const insertUser = db.prepare(`
      INSERT INTO users (email, password_hash, name, role, must_change_password, created_at, updated_at)
      VALUES (?, ?, ?, ?, 1, ?, ?)
    `)
    const updateUser = db.prepare(`
      UPDATE users
      SET password_hash = ?,
          failed_login_attempts = 0,
          locked_until = NULL,
          last_failed_login = NULL,
          must_change_password = 1,
          updated_at = ?
      WHERE id = ?
    `)
    const deleteSessions = db.prepare('DELETE FROM sessions WHERE user_id = ?')
    const insertAudit = db.prepare(`
      INSERT INTO audit_logs (action, user_id, target_user_id, details, success, created_at)
      VALUES ('password_change', NULL, ?, ?, 1, ?)
    `)

    const transaction = db.transaction(() => {
      const rotated = []
      const now = Date.now()

      for (const target of targets) {
        const configuredEmail = credentials[target.emailKey]
        const password = credentials[target.passwordKey]
        const displayName = target.label === 'master' ? 'Developer' : target.label === 'admin' ? 'Client Owner' : 'Content Editor'

        let user = findByEmail.get(configuredEmail) || findByRole.get(target.role)

        if (!user) {
          // Bootstrap path: a fresh database has no accounts yet — create the
          // privileged target so rotation doubles as the complete first-run
          // bootstrap (master/admin mandatory per security review).
          insertUser.run(configuredEmail, hashPassword(password), displayName, target.role, now, now)
          user = findByEmail.get(configuredEmail)
          if (!user) {
            throw new Error(`Failed to create ${target.label} account for ${configuredEmail}.`)
          }
        }

        if (user.role !== target.role) {
          throw new Error(`${user.email} has role ${user.role}; expected ${target.role}.`)
        }

        // Idempotency: when the configured credential is unchanged, do NOT
        // re-hash, force another password change, or wipe sessions — rotation
        // must only act on an actual credential change.
        if (passwordMatches(user.password_hash, password)) {
          rotated.push(`${target.label}:${user.email}:unchanged`)
          continue
        }

        updateUser.run(hashPassword(password), now, user.id)
        deleteSessions.run(user.id)
        insertAudit.run(
          user.id,
          JSON.stringify({
            actor: 'scripts/rotate-admin-passwords.mjs',
            target: target.label,
            email: user.email,
            sessionsInvalidated: true,
            mustChangePassword: true
          }),
          now
        )
        rotated.push(`${target.label}:${user.email}`)
      }

      return rotated
    })

    if (dryRun) {
      for (const target of targets) {
        const user = findByEmail.get(credentials[target.emailKey]) || findByRole.get(target.role)
        if (!user) throw new Error(`No ${target.label} account found.`)
        if (user.role !== target.role) {
          throw new Error(`${user.email} has role ${user.role}; expected ${target.role}.`)
        }
      }
      console.log(`[admin-passwords] dry-run: would rotate ${targets.length} account(s) in ${dbPath}`)
      return
    }

    const rotated = transaction()
    console.log(`[admin-passwords] rotated ${rotated.length} account(s): ${rotated.join(', ')}`)
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error))
  } finally {
    db.close()
  }
}

const options = parseArgs(process.argv.slice(2))
const envFile = path.resolve(process.cwd(), options.envFile)
const fileEnv = loadEnvFile(envFile)
const env = { ...process.env, ...fileEnv }
const credentials = buildCredentials(options, env)

validateCredentials(credentials)

if (options.writeEnv) {
  upsertEnvFile(envFile, credentials, options.dryRun)
}

if (options.apply) {
  applyPasswords(resolveDbPath(options, env), credentials, options.dryRun)
}

if (options.generate && !options.writeEnv) {
  console.log('[admin-passwords] generated credentials in memory only; use --write-env to persist them.')
}
