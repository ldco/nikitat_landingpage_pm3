#!/usr/bin/env npx tsx
/**
 * Puppet Master Init
 *
 * Interactive mode (default):
 *   npm run init
 *
 * Headless mode (for CI/CD):
 *   npm run init -- --headless --mode=build --type=website
 *   npm run init -- --headless --mode=develop
 */

import * as readline from 'readline'
import { resolve } from 'path'
import { execSync, spawn } from 'child_process'

// Import from centralized libraries
import { readPmMode } from './lib/config-reader'
import {
  writePmMode,
  applySetupConfig,
  createConfigBackup,
  validateConfigAfterWrite
} from './lib/config-writer'
import { ALL_MODULES, LOCALE_MAP, parseLocales } from './lib/modules'
import type { PmMode } from './lib/config-reader'

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function parseArgs(): Record<string, string> {
  const args: Record<string, string> = {}
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=')
      args[key] = value ?? 'true'
    }
  }
  return args
}

/**
 * Read current mode using centralized library
 */
function readCurrentMode(): string {
  try {
    return readPmMode(resolve(process.cwd(), 'project'))
  } catch {
    return 'unconfigured'
  }
}

/**
 * Set config mode with backup and validation
 */
function setConfigMode(mode: PmMode): void {
  const appDir = resolve(process.cwd(), 'project')

  // Create backup before modification
  try {
    createConfigBackup(appDir)
  } catch {
    // Continue even if backup fails on first run
  }

  // Use centralized writePmMode
  writePmMode(appDir, mode)

  // If develop mode, enable all modules and features
  if (mode === 'develop') {
    applySetupConfig(appDir, {
      pmMode: 'develop',
      projectType: 'website',
      adminEnabled: true,
      modules: [...ALL_MODULES],
      features: {
        cookies: true,
        multiLangs: true,
        doubleTheme: true,
        onepager: false,
        heroParallax: false,
        scrollytelling: false,
        pwa: false,
        twoFactorAuth: false
      }
    })
  }

  // Validate the write succeeded
  if (!validateConfigAfterWrite(appDir, mode)) {
    console.error('Warning: Config validation failed after write')
  }
}

/**
 * Write full config using centralized library
 */
function writeFullConfig(config: {
  pmMode: string
  projectType: string
  adminEnabled: boolean
  modules: string[]
  features: {
    cookies?: boolean
    multiLangs: boolean
    doubleTheme: boolean
    onepager: boolean
    heroParallax?: boolean
    scrollytelling?: boolean
    pwa: boolean
    twoFactorAuth?: boolean
  }
  locales: Array<{ code: string; iso: string; name: string }>
  defaultLocale: string
}): void {
  const appDir = resolve(process.cwd(), 'project')

  // Create backup before modification
  try {
    createConfigBackup(appDir)
  } catch {
    // Continue even if backup fails
  }

  // Use centralized applySetupConfig
  applySetupConfig(appDir, {
    pmMode: config.pmMode as PmMode,
    projectType: config.projectType as 'website' | 'app',
    adminEnabled: config.adminEnabled,
    locales: config.locales,
    defaultLocale: config.defaultLocale,
    modules: config.modules,
    features: config.features
  })

  // Validate the write succeeded
  if (!validateConfigAfterWrite(appDir, config.pmMode as PmMode)) {
    console.error('Warning: Config validation failed after write')
  }
}

function runCommand(cmd: string, desc: string): void {
  console.log(`\n${desc}...`)
  execSync(cmd, { stdio: 'inherit', cwd: process.cwd() })
}

function startDevServer(): void {
  console.log('\nStarting dev server...\n')
  spawn('npm', ['run', 'dev'], { cwd: process.cwd(), stdio: 'inherit', shell: true })
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEADLESS MODE
// ═══════════════════════════════════════════════════════════════════════════════

function runHeadless(args: Record<string, string>) {
  // Help
  if (args.help || args.h) {
    console.log(`
Puppet Master Init (Headless)

Usage:
  npm run init -- --headless --mode=build --type=website [options]

Options:
  --mode=<build|develop>     Required. Project mode
  --type=<website|app>       Project type (default: website)
  --admin=<true|false>       Enable admin panel (default: true)
  --modules=<list>           Comma-separated: blog,portfolio,team,testimonials,
                             faq,pricing,clients,features,contact (or "all")
  --locales=<list>           Comma-separated: en,ru,he,es,fr,de,zh,ja
  --default-locale=<code>    Default locale (default: first in list)
  --cookies=<true|false>     Public cookie/preferences runtime (default: true)
  --dark-mode=<true|false>   Dark mode toggle (default: true)
  --onepager=<true|false>    One-page layout (default: false)
  --pwa=<true|false>         Progressive Web App (default: false)
  --two-factor-auth=<true|false> Two-factor auth for admin/app login (default: false)

Examples:
  npm run init -- --headless --mode=build --type=website
  npm run init -- --headless --mode=build --modules=blog,contact --locales=en,es
  npm run init -- --headless --mode=develop
`)
    process.exit(0)
  }

  const mode = args.mode || process.env.PM_MODE || ''
  if (!['build', 'develop'].includes(mode)) {
    console.error('Error: --mode must be "build" or "develop"')
    process.exit(1)
  }

  console.log('🎭 Puppet Master Init (Headless)')
  console.log('━'.repeat(50))

  if (mode === 'develop') {
    const config = {
      pmMode: 'develop',
      projectType: 'website',
      adminEnabled: true,
      modules: [...ALL_MODULES],
      features: {
        cookies: true,
        multiLangs: true,
        doubleTheme: true,
        onepager: false,
        heroParallax: false,
        scrollytelling: false,
        pwa: false,
        twoFactorAuth: false
      },
      locales: parseLocales(['en', 'ru', 'he']),
      defaultLocale: 'en'
    }
    writeFullConfig(config)
    console.log('\n✅ DEVELOP mode configured')
    runCommand('npm run db:push', 'Database schema')
    runCommand('npm run db:seed', 'Seeding data')
    console.log('\n✅ Ready! Run: npm run dev')
  } else {
    const projectType = args.type || process.env.PM_TYPE || 'website'
    const adminEnabled = (args.admin || process.env.PM_ADMIN || 'true') === 'true'
    const modulesArg = args.modules ?? process.env.PM_MODULES
    const modulesStr = modulesArg ?? (projectType === 'website' ? 'contact' : '')
    const allModulesArray = [...ALL_MODULES] as string[]
    const modules = modulesStr === 'all'
      ? allModulesArray
      : modulesStr.split(',').map(m => m.trim()).filter(m => allModulesArray.includes(m))
    const localesStr = args.locales || process.env.PM_LOCALES || 'en'
    const locales = parseLocales(localesStr.split(','))
    if (locales.length === 0) locales.push(LOCALE_MAP.en)
    const defaultLocale = args['default-locale'] || process.env.PM_DEFAULT_LOCALE || locales[0].code
    const cookies = (args.cookies || process.env.PM_COOKIES || 'true') === 'true'
    const darkMode = (args['dark-mode'] || process.env.PM_DARK_MODE || 'true') === 'true'
    const onepager = (args.onepager || process.env.PM_ONEPAGER || 'false') === 'true'
    const pwa = (args.pwa || process.env.PM_PWA || 'false') === 'true'
    const twoFactorAuth = (args['two-factor-auth'] || process.env.PM_TWO_FACTOR_AUTH || 'false') === 'true'

    const config = {
      pmMode: 'build',
      projectType,
      adminEnabled,
      modules,
      features: {
        cookies,
        multiLangs: locales.length > 1,
        doubleTheme: darkMode,
        onepager,
        heroParallax: false,
        scrollytelling: false,
        pwa,
        twoFactorAuth
      },
      locales,
      defaultLocale
    }

    console.log(`\nConfiguration:`)
    console.log(`  Mode:     BUILD`)
    console.log(`  Type:     ${projectType}`)
    console.log(`  Admin:    ${adminEnabled}`)
    console.log(`  Modules:  ${modules.join(', ')}`)
    console.log(`  Locales:  ${locales.map(l => l.code).join(', ')}`)

    writeFullConfig(config)
    console.log('\n✅ Configuration saved')
    runCommand('npm run db:push', 'Database schema')
    console.log('\n✅ Ready! Run: npm run dev')
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERACTIVE MODE
// ═══════════════════════════════════════════════════════════════════════════════

async function runInteractive() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const ask = (q: string): Promise<string> => new Promise(res => rl.question(q, a => res(a.trim())))

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         PUPPET MASTER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)

  // Check if already configured
  const currentMode = readCurrentMode()
  if (currentMode !== 'unconfigured') {
    console.log(`Already configured: ${currentMode.toUpperCase()} mode\n`)
    console.log('1. Start Docker-based dev server')
    console.log('2. Reconfigure')
    const choice = await ask('\nEnter number: ')

    if (choice === '1') {
      rl.close()
      startDevServer()
      return
    }
    setConfigMode('unconfigured')
    console.log('\nReset. Continuing...\n')
  }

  // THE ONLY QUESTION: BUILD or DEVELOP?
  console.log('1. BUILD — Client project')
  console.log('2. DEVELOP — PM framework')
  const mode = await ask('\nEnter number: ')
  rl.close()

  if (mode === '2') {
    console.log('\n━━━ DEVELOP MODE ━━━\n')
    setConfigMode('develop')
    runCommand('npm run db:push', 'Database schema')
    runCommand('npm run db:seed', 'Seeding data')
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  READY — http://localhost:3000
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
    startDevServer()
  } else {
    console.log('\n━━━ BUILD MODE ━━━\n')
    setConfigMode('unconfigured')
    runCommand('npm run db:push', 'Database schema')
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Complete setup in browser: http://localhost:3000/init
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
    startDevServer()
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

const args = parseArgs()

// Headless if --headless flag OR --mode is specified
if (args.headless || args.mode) {
  runHeadless(args)
} else {
  runInteractive().catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
}
