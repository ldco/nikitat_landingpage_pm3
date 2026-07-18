/**
 * Setup Config API Tests
 *
 * Focus:
 * - production setup authorization contract
 * - malicious payload rejection
 * - config write behavior against the current patch-based serializer
 * - exported schema/sanitization helpers
 */

import { EventEmitter } from 'node:events'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const INITIAL_CONFIG = `
const config = {
  pmMode: 'unconfigured' as 'unconfigured' | 'build' | 'develop',
  aiWorkflow: 'claude' as 'claude' | 'qwen' | 'codex',
  entities: {
    website: false,
    app: false
  },
  admin: {
    enabled: false
  },
  locales: [
    { code: 'en', iso: 'en-US', name: 'English' }
  ],
  defaultLocale: 'en',
  modules: {
    blog: { enabled: false },
    portfolio: { enabled: false },
    team: { enabled: false },
    testimonials: { enabled: false },
    faq: { enabled: false },
    pricing: { enabled: false },
    clients: { enabled: false },
    features: { enabled: false },
    contact: { enabled: false }
  },
  features: {
    cookies: true,
    multiLangs: false,
    doubleTheme: false,
    onepager: false,
    heroParallax: false,
    scrollytelling: false,
    pwa: false,
    twoFactorAuth: false
  }
}
export default config
`.trim()

const MODULES_ENABLED_CONFIG = INITIAL_CONFIG
  .replace('blog: { enabled: false }', 'blog: { enabled: true }')
  .replace('contact: { enabled: false }', 'contact: { enabled: true }')

let currentConfigContent = INITIAL_CONFIG
const fileWrites = new Map<string, string>()
const mockReadBody = vi.fn()

type MockEvent = {
  method: string
  node: {
    req: {
      headers: Record<string, string>
    }
  }
}

const mockFs = {
  existsSync: vi.fn((filePath: string) => {
    if (filePath.endsWith('puppet-master.config.ts')) return true
    if (filePath.endsWith('sqlite.db')) return false
    return true
  }),
  readFileSync: vi.fn((filePath: string) => {
    if (filePath.includes('puppet-master.config.ts')) {
      return fileWrites.get(filePath) ?? currentConfigContent
    }
    return fileWrites.get(filePath) ?? ''
  }),
  writeFileSync: vi.fn((filePath: string, content: string) => {
    fileWrites.set(filePath, content)
    if (filePath.endsWith('puppet-master.config.ts')) {
      currentConfigContent = content
    }
  }),
  readdirSync: vi.fn(() => []),
  unlinkSync: vi.fn()
}

const mockPath = {
  resolve: vi.fn((...parts: string[]) => parts.join('/')),
  dirname: vi.fn((filePath: string) => filePath.split('/').slice(0, -1).join('/') || filePath)
}

const mockRequireSetupAccess = vi.fn((event: MockEvent, options?: { requireProductionAuth?: boolean }) => {
  if (options?.requireProductionAuth && process.env.PM_SETUP_SECRET) {
    const header = event?.node?.req?.headers?.['x-pm-setup-authorization']
    if (header !== process.env.PM_SETUP_SECRET) {
      throw new Error('Production authorization failed')
    }
  }

  return 'unconfigured'
})

vi.mock('fs', () => ({
  __esModule: true,
  default: mockFs,
  ...mockFs
}))

vi.mock('path', () => ({
  __esModule: true,
  default: mockPath,
  ...mockPath
}))

vi.mock('h3', async (importOriginal) => {
  const actual = await importOriginal<typeof import('h3')>()
  return {
    ...actual,
    readBody: mockReadBody
  }
})

vi.mock('child_process', () => ({
  spawn: vi.fn(() => {
    const child = new EventEmitter() as EventEmitter & {
      stdout: EventEmitter
      stderr: EventEmitter
      stdin: { write: ReturnType<typeof vi.fn>; end: ReturnType<typeof vi.fn> }
      kill: ReturnType<typeof vi.fn>
    }

    child.stdout = new EventEmitter()
    child.stderr = new EventEmitter()
    child.stdin = {
      write: vi.fn(),
      end: vi.fn()
    }
    child.kill = vi.fn()

    queueMicrotask(() => {
      child.emit('close', 0)
    })

    return child
  })
}))

vi.mock('../../server/utils/setup-guard', () => ({
  requireSetupAccess: mockRequireSetupAccess
}))

vi.mock('../../server/utils/workflow-paths', () => ({
  getWorkflowDataDir: vi.fn(() => '.qwen-data/claude'),
  getCurrentWorkflow: vi.fn(() => 'claude'),
  ensureWorkflowDataDir: vi.fn(() => true)
}))

vi.mock('../../server/database/client', () => ({
  useDatabase: vi.fn(() => ({
    exec: vi.fn()
  }))
}))

function createMockEvent(headers: Record<string, string> = {}): MockEvent {
  return {
    method: 'POST',
    node: {
      req: {
        headers
      }
    }
  }
}

describe('Setup Config API Security', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.PM_SETUP_SECRET
    delete process.env.NODE_ENV
    currentConfigContent = INITIAL_CONFIG
    fileWrites.clear()
    mockReadBody.mockReset()
  })

  describe('Malicious Payload Rejection', () => {
    it('rejects locale codes not in allowlist', async () => {
      const { default: setupHandler } = await import('../../server/api/setup/config.post.ts')

      mockReadBody.mockResolvedValue({
        pmMode: 'build',
        locales: [{ code: 'x$', iso: 'xx-XX', name: 'Invalid' }]
      })

      await expect(setupHandler(createMockEvent())).rejects.toThrow()
    })

    it('rejects ISO codes not in allowlist', async () => {
      const { default: setupHandler } = await import('../../server/api/setup/config.post.ts')

      mockReadBody.mockResolvedValue({
        pmMode: 'build',
        locales: [{ code: 'en', iso: 'not a locale', name: 'English' }]
      })

      await expect(setupHandler(createMockEvent())).rejects.toThrow()
    })

    it('rejects locale names with injection attempts', async () => {
      const { default: setupHandler } = await import('../../server/api/setup/config.post.ts')

      mockReadBody.mockResolvedValue({
        pmMode: 'build',
        locales: [{ code: 'en', iso: 'en-US', name: "English'; DROP TABLE users; --" }]
      })

      await expect(setupHandler(createMockEvent())).rejects.toThrow()
    })

    it('rejects module IDs not in ALL_MODULES', async () => {
      const { default: setupHandler } = await import('../../server/api/setup/config.post.ts')

      mockReadBody.mockResolvedValue({
        pmMode: 'build',
        modules: ['malicious-module', 'another-bad-module']
      })

      await expect(setupHandler(createMockEvent())).rejects.toThrow()
    })
  })

  describe('Helpers and Validation', () => {
    it('sanitizes strings with control characters', async () => {
      const { sanitizeString } = await import('../../server/api/setup/config.post.ts')

      const sanitized = sanitizeString('test\x00\x1f\x7fvalue')

      expect(sanitized).toBe('testvalue')
    })

    it('trims overly long strings', async () => {
      const { sanitizeString } = await import('../../server/api/setup/config.post.ts')

      const sanitized = sanitizeString('a'.repeat(1000), 500)

      expect(sanitized.length).toBe(500)
    })

    it('rejects invalid pmMode values', async () => {
      const { setupConfigSchema } = await import('../../server/api/setup/config.post.ts')

      expect(setupConfigSchema.safeParse({ pmMode: 'invalid-mode' }).success).toBe(false)
    })

    it('rejects invalid aiWorkflow values', async () => {
      const { setupConfigSchema } = await import('../../server/api/setup/config.post.ts')

      expect(
        setupConfigSchema.safeParse({
          pmMode: 'build',
          aiWorkflow: 'invalid-workflow'
        }).success
      ).toBe(false)
    })

    it('accepts a valid configuration', async () => {
      const { setupConfigSchema } = await import('../../server/api/setup/config.post.ts')

      expect(
        setupConfigSchema.safeParse({
          pmMode: 'build',
          aiWorkflow: 'claude',
          projectType: 'website',
          adminEnabled: true,
          locales: [{ code: 'en', iso: 'en-US', name: 'English' }],
          defaultLocale: 'en',
          features: {
            cookies: false,
            multiLangs: true,
            doubleTheme: true
          }
        }).success
      ).toBe(true)
    })
  })

  describe('Config Write Behavior', () => {
    it('generates patch-based config updates for a valid setup payload', async () => {
      const { generateConfigPatches, applyConfigPatches } = await import('../../server/api/setup/config.post.ts')

      const patches = generateConfigPatches({
        pmMode: 'build',
        projectType: 'website',
        adminEnabled: true,
        features: {
          cookies: false,
          multiLangs: true,
          doubleTheme: true,
          onepager: true
        }
      })
      const updatedContent = applyConfigPatches(INITIAL_CONFIG, patches)

      expect(updatedContent).toContain("pmMode: 'build'")
      expect(updatedContent).toContain('website: true')
      expect(updatedContent).toContain('enabled: true')
      expect(updatedContent).toContain('cookies: false')
      expect(updatedContent).toContain('multiLangs: true')
      expect(updatedContent).toContain('doubleTheme: true')
      expect(updatedContent).toContain('onepager: true')
      expect(updatedContent).toContain('export default config')
    })

    it('disables all module toggles when setup submits an empty module list', async () => {
      const { generateConfigPatches, applyConfigPatches } = await import('../../server/api/setup/config.post.ts')

      const patches = generateConfigPatches({
        pmMode: 'build',
        modules: []
      })
      const updatedContent = applyConfigPatches(MODULES_ENABLED_CONFIG, patches)

      expect(updatedContent).toContain('blog: { enabled: false }')
      expect(updatedContent).toContain('contact: { enabled: false }')
      expect(updatedContent).not.toContain('enabled: true')
    })

    it('writes the project brief with sanitized content when provided', async () => {
      const { default: setupHandler } = await import('../../server/api/setup/config.post.ts')

      mockReadBody.mockResolvedValue({
        pmMode: 'build',
        technicalBrief: 'Need a secure launch.\x00 Remove this byte.',
        projectName: 'Factory 22',
        projectDescription: 'Production website',
        targetAudience: 'B2B founders',
        customModules: 'Integrations'
      })

      await setupHandler(createMockEvent())

      const briefWrite = [...fileWrites.entries()].find(([filePath]) => filePath.endsWith('project-brief.md'))
      expect(briefWrite).toBeTruthy()
      expect(briefWrite?.[1]).toContain('Need a secure launch. Remove this byte.')
      expect(briefWrite?.[1]).not.toContain('\x00')
    })
  })
})
