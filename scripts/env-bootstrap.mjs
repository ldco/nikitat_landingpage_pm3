#!/usr/bin/env node
/**
 * Env bootstrap — runs automatically before `npm run dev` (predev),
 * `npm run setup` (presetup), and `npm run db:seed` / `npm run db:reset`
 * (predb:seed / predb:reset). On the first run it creates .env from
 * .env.example, replacing the template placeholders with generated long-lived
 * local secrets (strong admin bootstrap passwords + random hex encryption
 * keys), and prints a one-time warning. Later runs are silent: an existing
 * .env is left untouched.
 *
 * Lifecycle contracts (three distinct classes — see scripts/lib/deploy-env.sh
 * and src/lib/server/utils/env.ts):
 *   - runtime app config        — narrow surface the app reads via
 *                                 process.env, validated by env.ts. There are
 *                                 NO soft dev fallbacks: a missing required
 *                                 value fails clearly and early.
 *   - long-lived deploy secrets — generated only during first-time bootstrap;
 *                                 steady-state setup/deploy validate the
 *                                 initialized env and fail instead of
 *                                 regenerating.
 *   - first-run operator inputs — site facts + deploy transport, collected by
 *                                 `npm run setup` or validated by preflight.
 *
 * This script only ever fills missing/placeholder values; it never overwrites
 * an operator-provided value.
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ENV_FILE = path.join(ROOT_DIR, '.env')
const ENV_EXAMPLE_FILE = path.join(ROOT_DIR, '.env.example')

const PLACEHOLDER_PASSWORD = 'replace-with-a-strong-random-password'
const PLACEHOLDER_HEX_KEY = 'replace-with-64-character-hex-string-from-openssl'
const PASSWORD_LENGTH = 32
const HEX_KEY_BYTES = 32

const PASSWORD_GROUPS = [
  'ABCDEFGHJKLMNPQRSTUVWXYZ',
  'abcdefghijkmnopqrstuvwxyz',
  '23456789',
  '!#$%&()*+,-./:;<=>?@[]^_{|}~'
]

function randomInt(max) {
  return crypto.randomBytes(4).readUInt32BE(0) % max
}

function generatePassword(length = PASSWORD_LENGTH) {
  const all = PASSWORD_GROUPS.join('')
  const chars = PASSWORD_GROUPS.map(group => group[randomInt(group.length)])

  while (chars.length < length) {
    chars.push(all[randomInt(all.length)])
  }

  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1)
    ;[chars[index], chars[swapIndex]] = [chars[swapIndex], chars[index]]
  }

  return chars.join('')
}

function generateHexKey() {
  return crypto.randomBytes(HEX_KEY_BYTES).toString('hex')
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

function placeholderFor(key) {
  return key.startsWith('PM_ADMIN_') ? PLACEHOLDER_PASSWORD : PLACEHOLDER_HEX_KEY
}

function printCreatedWarning() {
  console.warn(
    '[env] Created .env from .env.example with generated long-lived local secrets.\n' +
      '[env] The runtime contract is now satisfied (src/lib/server/utils/env.ts).\n' +
      '[env] Deploy secrets are generated only during first-time bootstrap;\n' +
      '[env] steady-state `setup` / `deploy` validate the initialized env and\n' +
      '[env] never regenerate them. Only your site facts are operator-provided:\n' +
      '[env] SERVER_IP, SITE_DOMAIN and ACME_EMAIL (plus SERVER_ROOT_PASSWORD\n' +
      '[env] for the first-time password bootstrap).'
  )
}

function printMissingTemplateWarning() {
  console.warn(
    '[env] .env is missing and .env.example was not found.\n' +
      '[env] The runtime cannot start without a bootstrapped .env — there are\n' +
      '[env] no soft dev fallbacks (no ephemeral TOTP key). Re-clone with the\n' +
      '[env] template present, or create .env manually: `setup` / `deploy`\n' +
      '[env] auto-generate the long-lived secrets and need only your site\n' +
      '[env] facts (SERVER_IP, SITE_DOMAIN, ACME_EMAIL).'
  )
}

function main() {
  if (fs.existsSync(ENV_FILE)) return

  if (!fs.existsSync(ENV_EXAMPLE_FILE)) {
    printMissingTemplateWarning()
    return
  }

  const replacements = {
    PM_ADMIN_MASTER_PASSWORD: generatePassword(),
    PM_ADMIN_ADMIN_PASSWORD: generatePassword(),
    PM_ADMIN_USER_PASSWORD: generatePassword(),
    PM_SETTINGS_ENCRYPTION_KEY: generateHexKey(),
    TOTP_ENCRYPTION_KEY: generateHexKey()
  }

  const source = fs.readFileSync(ENV_EXAMPLE_FILE, 'utf8')
  const rendered = source
    .split(/\r?\n/)
    .map(line => {
      const match = line.match(/^(\s*(?:export\s+)?)([A-Za-z_][A-Za-z0-9_]*)(\s*=\s*)(.*)$/)
      if (!match || !(match[2] in replacements)) return line
      const current = stripEnvQuotes(match[4].trim())
      if (current !== placeholderFor(match[2])) return line
      return `${match[1]}${match[2]}${match[3]}${quoteEnv(replacements[match[2]])}`
    })
    .join('\n')

  fs.writeFileSync(ENV_FILE, `${rendered.replace(/\n+$/, '')}\n`, { mode: 0o600 })
  fs.chmodSync(ENV_FILE, 0o600)

  printCreatedWarning()
}

main()
