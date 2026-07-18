import { beforeEach, describe, expect, it } from 'vitest'
import { resolveAppModeRedirectPath } from '../../../app/middleware/app-mode.global'

const pmConfig = {
  entities: {
    website: false,
    app: true
  },
  appShell: {
    entryPath: '/login'
  },
  adminEnabled: false
}

describe('app-mode middleware app shell routing', () => {
  beforeEach(() => {
    pmConfig.entities.website = false
    pmConfig.entities.app = true
    pmConfig.adminEnabled = false
    pmConfig.appShell.entryPath = '/login'
  })

  it('keeps default /login behavior exact and redirects other app-only public routes', async () => {
    expect(resolveAppModeRedirectPath('/login', pmConfig)).toBeUndefined()
    expect(resolveAppModeRedirectPath('/login/settings', pmConfig)).toBe('/login')
  })

  it('allows a custom app-shell entry path as a route subtree', async () => {
    pmConfig.appShell.entryPath = '/dashboard'

    expect(resolveAppModeRedirectPath('/dashboard', pmConfig)).toBeUndefined()
    expect(resolveAppModeRedirectPath('/dashboard/settings', pmConfig)).toBeUndefined()
    expect(resolveAppModeRedirectPath('/pricing', pmConfig)).toBe('/dashboard')
  })

  it('fails safely when app-shell entry path is configured under admin', async () => {
    pmConfig.appShell.entryPath = '/admin/login'

    expect(resolveAppModeRedirectPath('/admin/login', pmConfig)).toBe('/login')
    expect(resolveAppModeRedirectPath('/pricing', pmConfig)).toBe('/login')
  })
})
