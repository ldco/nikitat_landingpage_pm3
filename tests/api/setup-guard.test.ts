/**
 * Setup guard authorization tests.
 *
 * These tests import the real setup guard and only mock filesystem reads so
 * production authorization behavior is covered without exercising the config
 * writer endpoint.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'

const mockFs = vi.hoisted(() => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn()
}))

const mockPath = vi.hoisted(() => ({
  resolve: vi.fn((...parts: string[]) => parts.join('/'))
}))

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

function createMockEvent(headers: Record<string, string> = {}, method = 'POST'): H3Event {
  return {
    method,
    node: {
      req: {
        headers
      }
    }
  } as unknown as H3Event
}

function createHttpError(input: { statusCode: number; statusMessage?: string; message?: string }): Error & {
  statusCode: number
  statusMessage?: string
} {
  return Object.assign(new Error(input.message || input.statusMessage), {
    statusCode: input.statusCode,
    statusMessage: input.statusMessage
  })
}

describe('requireSetupAccess production authorization', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    delete process.env.PM_SETUP_SECRET

    mockFs.existsSync.mockReturnValue(true)
    mockFs.readFileSync.mockReturnValue("const config = { pmMode: 'unconfigured' }")
    vi.stubGlobal('getHeader', vi.fn((event: H3Event, name: string) => {
      const headers = event.node.req.headers as Record<string, string | undefined>
      return headers[name.toLowerCase()]
    }))
    vi.stubGlobal('createError', vi.fn(createHttpError))
  })

  it('allows setup access without PM_SETUP_SECRET in development mode', async () => {
    const { requireSetupAccess } = await import('../../server/utils/setup-guard')

    expect(requireSetupAccess(createMockEvent(), { requireProductionAuth: true })).toBe('unconfigured')
  })

  it('rejects setup access when PM_SETUP_SECRET is set and header is missing', async () => {
    process.env.PM_SETUP_SECRET = 'test-secret-123'
    const { requireSetupAccess } = await import('../../server/utils/setup-guard')

    expect(() => requireSetupAccess(createMockEvent(), { requireProductionAuth: true })).toThrow(
      'Invalid or missing setup authorization secret'
    )
  })

  it('rejects setup access when PM_SETUP_SECRET does not match the header', async () => {
    process.env.PM_SETUP_SECRET = 'test-secret-123'
    const { requireSetupAccess } = await import('../../server/utils/setup-guard')

    expect(() => {
      requireSetupAccess(
        createMockEvent({ 'x-pm-setup-authorization': 'wrong-secret' }),
        { requireProductionAuth: true }
      )
    }).toThrow('Invalid or missing setup authorization secret')
  })

  it('allows setup access when PM_SETUP_SECRET matches the header', async () => {
    process.env.PM_SETUP_SECRET = 'test-secret-123'
    const { requireSetupAccess } = await import('../../server/utils/setup-guard')

    expect(
      requireSetupAccess(
        createMockEvent({ 'x-pm-setup-authorization': 'test-secret-123' }),
        { requireProductionAuth: true }
      )
    ).toBe('unconfigured')
  })

  it('denies mutating setup access after the project is configured', async () => {
    mockFs.readFileSync.mockReturnValue("const config = { pmMode: 'build' }")
    const { requireSetupAccess } = await import('../../server/utils/setup-guard')

    expect(() => requireSetupAccess(createMockEvent())).toThrow('Setup API is only accessible')
  })
})
