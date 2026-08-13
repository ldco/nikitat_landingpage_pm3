import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { ADMIN_SHELL_KEYS, getAdminKeysForRoute } from '$lib/server/admin-route-keys'

const ADMIN_DIR = join(process.cwd(), 'src', 'routes', 'admin')

/**
 * Every admin.* key literal referenced in the markup of an admin page. Covers
 * the getAdminT proxy access and the unified t() helper in both call styles —
 * including the two-argument form `t('admin.key', { params })` (the key quote
 * is not required to be immediately followed by a closing paren).
 */
const KEY_PATTERN =
  /(?:adminT\[['"](admin\.[\w.]+)['"]\]|t\(['"](admin\.[\w.]+)['"]|t\[['"](admin\.[\w.]+)['"]\])/g

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      walk(full, out)
    } else if (entry.endsWith('.svelte') && entry.startsWith('+')) {
      out.push(full)
    }
  }
  return out
}

function extractAdminKeys(source: string): Set<string> {
  const keys = new Set<string>()
  for (const match of source.matchAll(KEY_PATTERN)) {
    const key = match[1] ?? match[2] ?? match[3]
    if (key) keys.add(key)
  }
  return keys
}

/** src/routes/admin/.../+page.svelte → SvelteKit route id (/admin/faq, …). */
function routeIdFor(pageFile: string): string {
  const rel = relative(join(process.cwd(), 'src', 'routes'), pageFile)
  const parts = rel.split(sep).filter(p => p && p !== '+page.svelte')
  return '/' + parts.join('/')
}

describe('admin-route-keys registry — every admin page key is registered', () => {
  it('every key literal used by an admin page is available on its route', () => {
    const pages = walk(ADMIN_DIR).filter(f => f.endsWith('+page.svelte'))
    expect(pages.length).toBeGreaterThan(10)

    const missing: string[] = []
    for (const page of pages) {
      const routeId = routeIdFor(page)
      const usedKeys = extractAdminKeys(readFileSync(page, 'utf-8'))
      const registered = getAdminKeysForRoute(routeId)
      if (!registered) {
        missing.push(`${routeId}: route is not registered in admin-route-keys.ts`)
        continue
      }
      for (const key of usedKeys) {
        if (!registered.has(key)) {
          missing.push(`${routeId}: "${key}" used in ${page} but missing from the registry`)
        }
      }
    }
    expect(missing).toEqual([])
  })

  it('every key literal used by the admin shell layout is a shell key', () => {
    const layoutFile = join(ADMIN_DIR, '+layout.svelte')
    const usedKeys = extractAdminKeys(readFileSync(layoutFile, 'utf-8'))
    const shellKeys = new Set(ADMIN_SHELL_KEYS)
    const missing = [...usedKeys].filter(key => !shellKeys.has(key))
    expect(missing).toEqual([])
  })

  it('every seeded healthPage check/status key is registered for the health route', () => {
    // The health page resolves these families via template literals
    // (t[`admin.healthPage.check.${id}`], t[`admin.healthPage.status.${s}`]),
    // which the literal regex cannot extract — assert the seed-driven dynamic
    // key sets against the registry instead.
    const seedPath = join(process.cwd(), 'i18n', 'system-seed.json')
    const rows = JSON.parse(readFileSync(seedPath, 'utf-8')) as Array<{
      locale: string
      key: string
      value: string
    }>
    const registered = getAdminKeysForRoute('/admin/health')
    expect(registered).not.toBeNull()

    const dynamicKeys = new Set<string>()
    for (const row of rows) {
      if (
        row.key.startsWith('admin.healthPage.check.') ||
        row.key.startsWith('admin.healthPage.status.')
      ) {
        dynamicKeys.add(row.key)
      }
    }
    expect(dynamicKeys.size).toBeGreaterThan(0)
    const missing = [...dynamicKeys].filter(key => !registered?.has(key))
    expect(missing).toEqual([])
  })
})
