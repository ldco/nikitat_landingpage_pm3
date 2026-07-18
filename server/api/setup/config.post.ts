/**
 * Save Setup Config API
 *
 * POST /api/setup/config
 * Body: SetupConfig
 * Returns: { success: true, databaseStatus: 'created' | 'exists' | 'error' }
 *
 * Writes configuration to project/puppet-master.config.ts.
 * Security: Only accessible when pmMode is 'unconfigured'
 *
 * SECURITY HARDENING:
 * - Structured config serialization (no regex-based mutation)
 * - Strict allowlists for all string fields
 * - Production authorization secret required (PM_SETUP_SECRET)
 * - Input sanitization and validation
 */
import { existsSync, readFileSync, writeFileSync, readdirSync, unlinkSync } from 'fs'
import { resolve, dirname } from 'path'
import { defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import { requireSetupAccess } from '../../utils/setup-guard'
import {
  ALL_MODULES,
  isSupportedLocaleCode,
  isSupportedLocaleIso,
  type ModuleId
} from '~~/shared/modules'
import { getWorkflowDataDir, getCurrentWorkflow, ensureWorkflowDataDir } from '../../utils/workflow-paths'
import { createApiError } from '../../utils/api-error'

type PmMode = 'unconfigured' | 'build' | 'develop'
type ProjectType = 'website' | 'app'
type AiWorkflow = 'claude' | 'qwen' | 'codex'
type ErrorDetails = {
  code?: string
  message?: string
  statusCode?: number
}

function getErrorDetails(error: unknown): ErrorDetails {
  return error && typeof error === 'object' ? (error as ErrorDetails) : {}
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY: ALLOWLISTS & VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Sanitize string input - allow only safe characters
 * Prevents injection attacks via config values
 */
export function sanitizeString(input: string, maxLength: number = 500): string {
  // Remove null bytes and control characters
  // eslint-disable-next-line no-control-regex
  const sanitized = input.replace(/[\x00-\x1f\x7f-\x9f]/g, '')
  // Trim and limit length
  return sanitized.trim().slice(0, maxLength)
}

/**
 * Validate locale code against allowlist
 */
function validateLocaleCode(code: string): boolean {
  return isSupportedLocaleCode(code)
}

/**
 * Validate ISO code against allowlist
 */
function validateIsoCode(iso: string): boolean {
  return isSupportedLocaleIso(iso)
}

/**
 * Validate locale name - alphanumeric with spaces, hyphens, apostrophes only
 */
function validateLocaleName(name: string): boolean {
  const namePattern = /^[\p{L}\p{N}\s\-']+$/u
  return namePattern.test(name) && name.length <= 100
}

/**
 * Validate module ID against allowed modules
 */
function validateModuleId(id: string): id is ModuleId {
  return (ALL_MODULES as readonly string[]).includes(id)
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIG HELPERS (structured serialization)
// ═══════════════════════════════════════════════════════════════════════════════

function getConfigPath(projectDir: string): string {
  return resolve(projectDir, 'puppet-master.config.ts')
}

function readConfigRaw(projectDir: string): string {
  const configPath = getConfigPath(projectDir)
  return readFileSync(configPath, 'utf-8')
}

function createBackup(projectDir: string): string | undefined {
  try {
    const configPath = getConfigPath(projectDir)
    if (!existsSync(configPath)) return undefined

    const dir = dirname(configPath)
    const timestamp = Date.now()
    const backupPath = resolve(dir, `puppet-master.config.ts.backup.${timestamp}`)

    const content = readFileSync(configPath, 'utf-8')
    writeFileSync(backupPath, content, 'utf-8')

    // Clean up old backups (keep only 3)
    const backups = readdirSync(dir)
      .filter(f => f.startsWith('puppet-master.config.ts.backup.'))
      .map(f => ({ path: resolve(dir, f), ts: parseInt(f.split('.').pop() || '0', 10) }))
      .sort((a, b) => b.ts - a.ts)

    for (const backup of backups.slice(3)) {
      try {
        unlinkSync(backup.path)
      } catch {
        // Ignore stale backup cleanup errors.
      }
    }

    return backupPath
  } catch {
    return undefined
  }
}

function rollbackToBackup(projectDir: string): boolean {
  try {
    const configPath = getConfigPath(projectDir)
    const dir = dirname(configPath)

    const backups = readdirSync(dir)
      .filter(f => f.startsWith('puppet-master.config.ts.backup.'))
      .map(f => ({ path: resolve(dir, f), ts: parseInt(f.split('.').pop() || '0', 10) }))
      .sort((a, b) => b.ts - a.ts)

    if (backups.length === 0) return false

    const backupContent = readFileSync(backups[0].path, 'utf-8')
    writeFileSync(configPath, backupContent, 'utf-8')
    return true
  } catch {
    return false
  }
}

/**
 * Keep .env PM_MODE in sync with config file so the runtime takes effect.
 * Runtime config (nuxt.config.ts:497) reads PM_MODE env var first.
 */
function syncEnvPmMode(mode: string): void {
  try {
    const envPath = resolve(process.cwd(), '.env')
    if (!existsSync(envPath)) return

    let content = readFileSync(envPath, 'utf-8')

    if (/^PM_MODE=/m.test(content)) {
      content = content.replace(/^PM_MODE=.*$/m, `PM_MODE=${mode}`)
    } else {
      content += `\nPM_MODE=${mode}\n`
    }

    writeFileSync(envPath, content, 'utf-8')
  } catch {
    // Non-critical — next dev server restart will pick up config file fallback.
  }
}

function readPmMode(projectDir: string): PmMode {
  try {
    const content = readConfigRaw(projectDir)
    const match = content.match(/pmMode:\s*['"](\w+)['"]/)
    if (match && ['unconfigured', 'build', 'develop'].includes(match[1])) {
      return match[1] as PmMode
    }
    return 'unconfigured'
  } catch {
    return 'unconfigured'
  }
}

function readAiWorkflow(projectDir: string): AiWorkflow {
  try {
    const content = readConfigRaw(projectDir)
    const match = content.match(/aiWorkflow:\s*['"](\w+)['"]/)
    if (match && ['claude', 'qwen', 'codex'].includes(match[1])) {
      return match[1] as AiWorkflow
    }
    return 'claude'
  } catch {
    return 'claude'
  }
}

function databaseExists(projectDir: string): boolean {
  return existsSync(resolve(projectDir, '..', 'data', 'sqlite.db'))
}

/**
 * Structured locale config with validation
 */
interface ValidatedLocale {
  code: string
  iso: string
  name: string
}

/**
 * Structured setup config with validated fields
 */
interface SetupConfig {
  pmMode: PmMode
  aiWorkflow?: AiWorkflow
  projectType?: ProjectType
  adminEnabled?: boolean
  locales?: ValidatedLocale[]
  defaultLocale?: string
  modules?: ModuleId[]
  features?: {
    cookies?: boolean
    multiLangs?: boolean
    doubleTheme?: boolean
    colorRenderFallback?: boolean
    onepager?: boolean
    heroParallax?: boolean
    scrollytelling?: boolean
    interactiveHeader?: boolean
    mobileInteractiveHeader?: boolean
    hideHeaderOnScroll?: boolean
    verticalNav?: boolean
    headerFooterWidthMode?: 'contained' | 'full'
    pageTransitions?: string
    appVerticalNav?: boolean
    pwa?: boolean
    twoFactorAuth?: boolean
    contactEmailConfirmation?: boolean
    contactTelegramNotify?: boolean
    footerNav?: boolean
    footerCta?: boolean
    footerLegalLinks?: boolean
    footerMadeBy?: boolean
    footerMadeWith?: boolean
    backToTop?: boolean
  }
  defaultTheme?: 'system' | 'light' | 'dark'
  headerContactEnabled?: boolean
}

/**
 * Generate config update patches for specific fields
 * Updates only setup-managed fields while preserving all other sections
 */
export function generateConfigPatches(config: SetupConfig): Array<{
  pattern: RegExp
  replacement: string
  description: string
}> {
  const patches: Array<{ pattern: RegExp; replacement: string; description: string }> = []

  // 1. Update pmMode
  patches.push({
    pattern: /pmMode:\s*['"][^'"]+['"]\s*as\s*(?:const|'[^']+'\s*\|\s*'[^']+'\s*\|\s*'[^']+')/,
    replacement: `pmMode: '${config.pmMode}' as 'unconfigured' | 'build' | 'develop'`,
    description: 'pmMode'
  })

  // 2. Update aiWorkflow if provided
  if (config.aiWorkflow) {
    patches.push({
      pattern: /aiWorkflow:\s*['"][^'"]+['"]\s*as\s*(?:const|'[^']+'\s*\|\s*'[^']+'\s*\|\s*'[^']+')/,
      replacement: `aiWorkflow: '${config.aiWorkflow}' as 'claude' | 'qwen' | 'codex'`,
      description: 'aiWorkflow'
    })
  }

  // 3. Update project type (entities)
  if (config.projectType) {
    patches.push({
      pattern: /(entities:\s*\{[\s\S]*?website:\s*)(true|false)/,
      replacement: `$1${config.projectType === 'website'}`,
      description: 'entities.website'
    })
    patches.push({
      pattern: /(entities:\s*\{[\s\S]*?app:\s*)(true|false)/,
      replacement: `$1${config.projectType === 'app'}`,
      description: 'entities.app'
    })
  }

  // 4. Update admin.enabled
  if (config.adminEnabled !== undefined) {
    patches.push({
      pattern: /(admin:\s*\{[\s\S]*?enabled:\s*)(true|false)/,
      replacement: `$1${config.adminEnabled}`,
      description: 'admin.enabled'
    })
  }

  // 5. Update locales
  if (config.locales && config.locales.length > 0) {
    const localesStr = config.locales
      .map(l => `    { code: '${l.code}', iso: '${l.iso}', name: '${l.name}' }`)
      .join(',\n')
    patches.push({
      pattern: /(locales:\s*)\[[\s\S]*?\]/,
      replacement: `$1[\n${localesStr}\n  ]`,
      description: 'locales'
    })
  }

  // 6. Update defaultLocale
  if (config.defaultLocale) {
    patches.push({
      pattern: /(defaultLocale:\s*)['"][^'"]*['"]/,
      replacement: `$1'${config.defaultLocale}'`,
      description: 'defaultLocale'
    })
  }

  // 7. Update modules
  if (config.modules !== undefined) {
    for (const moduleId of ALL_MODULES) {
      const enabled = config.modules.includes(moduleId)
      patches.push({
        pattern: new RegExp(`(${moduleId}:\\s*\\{[^}]*)(enabled:\\s*)(true|false)`, 's'),
        replacement: `$1$2${enabled}`,
        description: `modules.${moduleId}`
      })
    }
  }

  // 8. Update features
  if (config.features) {
    if (config.features.cookies !== undefined) {
      patches.push({
        pattern: /(features:\s*\{\s*(?:\/\/[^\n]*\n\s*)?)(?:cookies:\s*(?:true|false),?[^\n]*\n\s*)?/,
        replacement: `$1cookies: ${config.features.cookies},\n    `,
        description: 'features.cookies'
      })
    }
    if (config.features.multiLangs !== undefined) {
      patches.push({
        pattern: /(features:\s*\{[\s\S]*?multiLangs:\s*)(true|false)/,
        replacement: `$1${config.features.multiLangs}`,
        description: 'features.multiLangs'
      })
    }
    if (config.features.doubleTheme !== undefined) {
      patches.push({
        pattern: /(features:\s*\{[\s\S]*?doubleTheme:\s*)(true|false)/,
        replacement: `$1${config.features.doubleTheme}`,
        description: 'features.doubleTheme'
      })
    }
    if (config.features.onepager !== undefined) {
      patches.push({
        pattern: /(features:\s*\{[\s\S]*?onepager:\s*)(true|false)/,
        replacement: `$1${config.features.onepager}`,
        description: 'features.onepager'
      })
    }
    if (config.features.heroParallax !== undefined) {
      patches.push({
        pattern: /(features:\s*\{[\s\S]*?heroParallax:\s*)(true|false)/,
        replacement: `$1${config.features.heroParallax}`,
        description: 'features.heroParallax'
      })
    }
    if (config.features.scrollytelling !== undefined) {
      patches.push({
        pattern: /(features:\s*\{[\s\S]*?scrollytelling:\s*)(true|false)/,
        replacement: `$1${config.features.scrollytelling}`,
        description: 'features.scrollytelling'
      })
    }
    if (config.features.pwa !== undefined) {
      patches.push({
        pattern: /(features:\s*\{[\s\S]*?pwa:\s*)(true|false)/,
        replacement: `$1${config.features.pwa}`,
        description: 'features.pwa'
      })
    }
    if (config.features.twoFactorAuth !== undefined) {
      patches.push({
        pattern: /(features:\s*\{[\s\S]*?twoFactorAuth:\s*)(true|false)/,
        replacement: `$1${config.features.twoFactorAuth}`,
        description: 'features.twoFactorAuth'
      })
    }
    if (config.features.colorRenderFallback !== undefined) {
      patches.push({
        pattern: /(features:\s*\{[\s\S]*?colorRenderFallback:\s*)(true|false)/,
        replacement: `$1${config.features.colorRenderFallback}`,
        description: 'features.colorRenderFallback'
      })
    }
    if (config.features.interactiveHeader !== undefined) {
      patches.push({
        pattern: /(features:\s*\{[\s\S]*?interactiveHeader:\s*)(true|false)/,
        replacement: `$1${config.features.interactiveHeader}`,
        description: 'features.interactiveHeader'
      })
    }
    if (config.features.mobileInteractiveHeader !== undefined) {
      patches.push({
        pattern: /(features:\s*\{[\s\S]*?mobileInteractiveHeader:\s*)(true|false)/,
        replacement: `$1${config.features.mobileInteractiveHeader}`,
        description: 'features.mobileInteractiveHeader'
      })
    }
    if (config.features.hideHeaderOnScroll !== undefined) {
      patches.push({
        pattern: /(features:\s*\{[\s\S]*?hideHeaderOnScroll:\s*)(true|false)/,
        replacement: `$1${config.features.hideHeaderOnScroll}`,
        description: 'features.hideHeaderOnScroll'
      })
    }
    if (config.features.verticalNav !== undefined) {
      patches.push({
        pattern: /(features:\s*\{[\s\S]*?verticalNav:\s*)(true|false)/,
        replacement: `$1${config.features.verticalNav}`,
        description: 'features.verticalNav'
      })
    }
    if (config.features.headerFooterWidthMode !== undefined) {
      patches.push({
        pattern: /(features:\s*\{[\s\S]*?headerFooterWidthMode:\s*['"])(contained|full)['"]/,
        replacement: `$1${config.features.headerFooterWidthMode}'`,
        description: 'features.headerFooterWidthMode'
      })
    }
    if (config.features.pageTransitions !== undefined) {
      patches.push({
        pattern: /(features:\s*\{[\s\S]*?pageTransitions:\s*['"])([^'"]*)['"]/,
        replacement: `$1${config.features.pageTransitions}'`,
        description: 'features.pageTransitions'
      })
    }
    if (config.features.appVerticalNav !== undefined) {
      patches.push({
        pattern: /(features:\s*\{[\s\S]*?appVerticalNav:\s*)(true|false)/,
        replacement: `$1${config.features.appVerticalNav}`,
        description: 'features.appVerticalNav'
      })
    }
    if (config.features.contactEmailConfirmation !== undefined) {
      patches.push({
        pattern: /(features:\s*\{[\s\S]*?contactEmailConfirmation:\s*)(true|false)/,
        replacement: `$1${config.features.contactEmailConfirmation}`,
        description: 'features.contactEmailConfirmation'
      })
    }
    if (config.features.contactTelegramNotify !== undefined) {
      patches.push({
        pattern: /(features:\s*\{[\s\S]*?contactTelegramNotify:\s*)(true|false)/,
        replacement: `$1${config.features.contactTelegramNotify}`,
        description: 'features.contactTelegramNotify'
      })
    }
    if (config.features.footerNav !== undefined) {
      patches.push({
        pattern: /(features:\s*\{[\s\S]*?footerNav:\s*)(true|false)/,
        replacement: `$1${config.features.footerNav}`,
        description: 'features.footerNav'
      })
    }
    if (config.features.footerCta !== undefined) {
      patches.push({
        pattern: /(features:\s*\{[\s\S]*?footerCta:\s*)(true|false)/,
        replacement: `$1${config.features.footerCta}`,
        description: 'features.footerCta'
      })
    }
    if (config.features.footerLegalLinks !== undefined) {
      patches.push({
        pattern: /(features:\s*\{[\s\S]*?footerLegalLinks:\s*)(true|false)/,
        replacement: `$1${config.features.footerLegalLinks}`,
        description: 'features.footerLegalLinks'
      })
    }
    if (config.features.footerMadeBy !== undefined) {
      patches.push({
        pattern: /(features:\s*\{[\s\S]*?footerMadeBy:\s*)(true|false)/,
        replacement: `$1${config.features.footerMadeBy}`,
        description: 'features.footerMadeBy'
      })
    }
    if (config.features.footerMadeWith !== undefined) {
      patches.push({
        pattern: /(features:\s*\{[\s\S]*?footerMadeWith:\s*)(true|false)/,
        replacement: `$1${config.features.footerMadeWith}`,
        description: 'features.footerMadeWith'
      })
    }
    if (config.features.backToTop !== undefined) {
      patches.push({
        pattern: /(features:\s*\{[\s\S]*?backToTop:\s*)(true|false)/,
        replacement: `$1${config.features.backToTop}`,
        description: 'features.backToTop'
      })
    }
  }

  // 9. Update defaultTheme
  if (config.defaultTheme) {
    patches.push({
      pattern: /(defaultTheme:\s*['"])(system|light|dark)['"]/,
      replacement: `$1${config.defaultTheme}'`,
      description: 'defaultTheme'
    })
  }

  // 10. Update headerContact.enabled
  if (config.headerContactEnabled !== undefined) {
    patches.push({
      pattern: /(headerContact:\s*\{[\s\S]*?enabled:\s*)(true|false)/,
      replacement: `$1${config.headerContactEnabled}`,
      description: 'headerContact.enabled'
    })
  }

  return patches
}

/**
 * Apply config patches to existing content
 * Preserves all sections not explicitly updated
 */
export function applyConfigPatches(content: string, patches: Array<{
  pattern: RegExp
  replacement: string
  description: string
}>): string {
  let updated = content

  for (const { pattern, replacement, description } of patches) {
    const before = updated
    const matched = before.search(pattern) !== -1
    updated = updated.replace(pattern, replacement)

    // Treat "already at desired value" as success as long as the target pattern exists.
    if (!matched) {
      throw new Error(`Failed to apply patch for ${description}`)
    }
  }

  return updated
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMA & HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

const localeSchema = z.object({
  code: z.string().max(10),
  iso: z.string().max(10),
  name: z.string().max(100)
})

const featuresSchema = z.object({
  cookies: z.boolean().optional(),
  multiLangs: z.boolean().optional(),
  doubleTheme: z.boolean().optional(),
  colorRenderFallback: z.boolean().optional(),
  onepager: z.boolean().optional(),
  heroParallax: z.boolean().optional(),
  scrollytelling: z.boolean().optional(),
  interactiveHeader: z.boolean().optional(),
  mobileInteractiveHeader: z.boolean().optional(),
  hideHeaderOnScroll: z.boolean().optional(),
  verticalNav: z.boolean().optional(),
  headerFooterWidthMode: z.enum(['contained', 'full']).optional(),
  pageTransitions: z.string().optional(),
  appVerticalNav: z.boolean().optional(),
  twoFactorAuth: z.boolean().optional(),
  pwa: z.boolean().optional(),
  contactEmailConfirmation: z.boolean().optional(),
  contactTelegramNotify: z.boolean().optional(),
  footerNav: z.boolean().optional(),
  footerCta: z.boolean().optional(),
  footerLegalLinks: z.boolean().optional(),
  footerMadeBy: z.boolean().optional(),
  footerMadeWith: z.boolean().optional(),
  backToTop: z.boolean().optional()
})

export const setupConfigSchema = z.object({
  pmMode: z.enum(['unconfigured', 'build', 'develop']),
  projectName: z.string().max(200).optional(),
  projectDescription: z.string().max(500).optional(),
  targetAudience: z.string().max(500).optional(),
  technicalBrief: z.string().max(500000).optional(),
  aiWorkflow: z.enum(['claude', 'qwen', 'codex']).optional(),
  projectType: z.enum(['website', 'app']).optional(),
  adminEnabled: z.boolean().optional(),
  locales: z.array(localeSchema).optional(),
  defaultLocale: z.string().max(10).optional(),
  modules: z.array(z.string()).optional(),
  customModules: z.string().max(1000).optional(),
  features: featuresSchema.optional(),
  defaultTheme: z.enum(['system', 'light', 'dark']).optional(),
  headerContactEnabled: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  // Security: Require production authorization if PM_SETUP_SECRET is set
  requireSetupAccess(event, { requireProductionAuth: true })

  const body = await readBody(event)

  // Validate input
  const result = setupConfigSchema.safeParse(body)
  if (!result.success) {
    throw createApiError(400, 'setup.invalidConfig', {
      validation: result.error.issues.map(issue => ({
        path: issue.path.join('.'),
        code: issue.code
      }))
    })
  }

  const config = result.data
  const projectDir = resolve(process.cwd(), 'project')
  const configPath = getConfigPath(projectDir)

  if (!existsSync(configPath)) {
    throw createApiError(500, 'setup.configNotFound')
  }

  // Validate locales against allowlists
  if (config.locales && config.locales.length > 0) {
    for (const locale of config.locales) {
      if (!validateLocaleCode(locale.code)) {
        throw createApiError(400, 'setup.invalidLocaleCode', { localeCode: locale.code })
      }
      if (!validateIsoCode(locale.iso)) {
        throw createApiError(400, 'setup.invalidLocaleIso', { localeIso: locale.iso })
      }
      if (!validateLocaleName(locale.name)) {
        throw createApiError(400, 'setup.invalidLocaleName', { localeCode: locale.code })
      }
    }
  }

  // Validate modules
  if (config.modules && config.modules.length > 0) {
    const invalidModules = config.modules.filter(m => !validateModuleId(m))
    if (invalidModules.length > 0) {
      throw createApiError(400, 'setup.invalidModules', { invalidModules })
    }
  }

  // Read existing config
  let existingContent: string
  try {
    existingContent = readConfigRaw(projectDir)
  } catch (error: unknown) {
    throw createApiError(500, 'setup.configReadFailed', { reason: getErrorDetails(error).code })
  }

  // Create backup before modification
  const backupPath = createBackup(projectDir)

  try {
    // Generate and apply patches
    const patches = generateConfigPatches({
      pmMode: config.pmMode as PmMode,
      aiWorkflow: config.aiWorkflow as AiWorkflow | undefined,
      projectType: config.projectType as ProjectType | undefined,
      adminEnabled: config.adminEnabled,
      locales: config.locales,
      defaultLocale: config.defaultLocale,
      modules: config.modules as ModuleId[] | undefined,
      features: config.features,
      defaultTheme: config.defaultTheme,
      headerContactEnabled: config.headerContactEnabled
    })

    const updatedContent = applyConfigPatches(existingContent, patches)

    // Write updated config
    writeFileSync(configPath, updatedContent, 'utf-8')

    // Validate the write succeeded
    const actualMode = readPmMode(projectDir)
    if (actualMode !== config.pmMode) {
      throw createApiError(500, 'setup.configValidationFailed', {
        expected: config.pmMode,
        actual: actualMode
      })
    }

    // Keep .env PM_MODE in sync with config so the runtime takes effect.
    // Runtime config reads PM_MODE env var first (nuxt.config.ts:497).
    syncEnvPmMode(config.pmMode)

    // Validate aiWorkflow was also written correctly if provided
    if (config.aiWorkflow) {
      const actualWorkflow = readAiWorkflow(projectDir)
      if (actualWorkflow !== config.aiWorkflow) {
        throw createApiError(500, 'setup.workflowValidationFailed', {
          expected: config.aiWorkflow,
          actual: actualWorkflow
        })
      }
    }
  } catch (error: unknown) {
    const details = getErrorDetails(error)
    // If not already a create error, wrap it
    if (!details.statusCode) {
      // Try to rollback
      if (backupPath) {
        rollbackToBackup(projectDir)
      }
      throw createApiError(500, 'setup.configWriteFailed')
    }
    throw error
  }

  // Save project brief and context for selected AI workflow
  const workflowToUse = config.aiWorkflow || getCurrentWorkflow()
  const workflowDataDir = getWorkflowDataDir(workflowToUse)
  const workflowDataPath = resolve(process.cwd(), workflowDataDir)

  if (!ensureWorkflowDataDir(workflowToUse)) {
    throw createApiError(500, 'setup.workflowDirectoryFailed', { workflow: workflowToUse })
  }

  // Write project brief if provided (sanitized)
  if (config.technicalBrief) {
    const briefPath = resolve(workflowDataPath, 'project-brief.md')
    const sanitizedBrief = sanitizeString(config.technicalBrief, 500000)
    const sanitizedProjectName = config.projectName ? sanitizeString(config.projectName, 200) : undefined
    const sanitizedDescription = config.projectDescription ? sanitizeString(config.projectDescription, 500) : undefined
    const sanitizedAudience = config.targetAudience ? sanitizeString(config.targetAudience, 500) : undefined
    const sanitizedCustomModules = config.customModules ? sanitizeString(config.customModules, 1000) : undefined

    const briefContent = `# Project Brief

> Auto-generated from setup wizard on ${new Date().toISOString().split('T')[0]}

${sanitizedProjectName ? `## Project: ${sanitizedProjectName}\n` : ''}
${sanitizedDescription ? `**Description:** ${sanitizedDescription}\n` : ''}
${sanitizedAudience ? `**Target Audience:** ${sanitizedAudience}\n` : ''}
${sanitizedCustomModules ? `**Custom Modules Requested:** ${sanitizedCustomModules}\n` : ''}

---

## Technical Brief

${sanitizedBrief}
`
    writeFileSync(briefPath, briefContent, 'utf-8')
  }

  // Run db:push to create/update database schema
  // GAP-009: Skip db:push in production - requires manual migration in containerized deployments
  let databaseStatus: 'created' | 'exists' | 'error' | 'timeout' | 'manual_required' = 'exists'
  let databaseMessageKey: string | undefined
  const dbExisted = databaseExists(projectDir)

  const isProduction = process.env.NODE_ENV === 'production'

  if (isProduction) {
    databaseStatus = 'manual_required'
    databaseMessageKey = 'setup.databaseManualRequired'
  } else {
    try {
      const { spawn } = await import('child_process')

      const dbPushResult = await new Promise<{
        status: 'success' | 'error' | 'timeout'
        messageKey?: string
        exitCode?: number | null
      }>((resolve) => {
        const timeout = 60000

        const child = spawn('npm', ['run', 'db:push'], {
          cwd: process.cwd(),
          env: { ...process.env, FORCE_COLOR: '0' },
          stdio: ['pipe', 'pipe', 'pipe']
        })

        let stdout = ''
        let stderr = ''

        child.stdout?.on('data', (data) => {
          stdout += data.toString()
        })

        child.stderr?.on('data', (data) => {
          stderr += data.toString()
        })

        child.stdin?.write('y\n')
        child.stdin?.end()

        const timeoutId = setTimeout(() => {
          child.kill('SIGTERM')
          console.warn('db:push timed out after 60 seconds')
          resolve({
            status: 'timeout',
            messageKey: 'setup.databaseTimeout'
          })
        }, timeout)

        child.on('close', (code) => {
          clearTimeout(timeoutId)
          if (code === 0) {
            resolve({ status: 'success' })
          } else {
            console.error('db:push failed:', { code, stdout, stderr })
            resolve({
              status: 'error',
              messageKey: 'setup.databasePushFailed',
              exitCode: code
            })
          }
        })

        child.on('error', (err) => {
          clearTimeout(timeoutId)
          console.error('db:push spawn error:', err.message)
          resolve({
            status: 'error',
            messageKey: 'setup.databaseStartFailed'
          })
        })
      })

      if (dbPushResult.status === 'success') {
        databaseStatus = dbExisted ? 'exists' : 'created'
      } else if (dbPushResult.status === 'timeout') {
        databaseStatus = 'timeout'
        databaseMessageKey = dbPushResult.messageKey
      } else {
        databaseStatus = 'error'
        databaseMessageKey = dbPushResult.messageKey
      }
    } catch (error: unknown) {
      if (!isProduction) {
        console.error('db:push error:', getErrorDetails(error).message ?? 'Unknown error')
      }
      databaseStatus = 'error'
      databaseMessageKey = 'setup.databaseUnexpectedError'
    }
  }

  return {
    success: true,
    data: {
      databaseStatus,
      databaseMessageKey,
      aiWorkflow: config.aiWorkflow || readAiWorkflow(projectDir)
    }
  }
})
