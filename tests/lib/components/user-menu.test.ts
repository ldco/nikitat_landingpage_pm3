import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/svelte'
import { initContent } from '$lib/stores/content.svelte'
import UserMenu from '$lib/components/molecules/UserMenu.svelte'

/**
 * Regression test — PM2 mobile user menu parity (review):
 *   - mobile info block: name large+bold, email/role text-sm
 *   - ONE settings row: sun icon (ThemeToggle) left + language codes right,
 *     no "Language"/"Theme" text labels (the narrow label column used to wrap)
 *   - exactly one divider above and one below the settings row
 *   - Change Password bright (text-pm-text); Logout accent-red (text-pm-danger)
 */

const user = { name: 'Developer', email: 'dev@example.com', role: 'editor' }

beforeAll(() => {
  // Deterministic labels — the unified t() reads the DB-backed store first.
  initContent({
    'admin.userMenu': 'User menu',
    'auth.changePassword': 'Change Password',
    'auth.logout': 'Logout',
    'common.theme': 'Theme',
    'common.language': 'Language'
  })
})

// Svelte 5 flushes $state updates on the microtask queue — wait for the
// re-render triggered by the avatar click before asserting on the dropdown.
function tick() {
  return new Promise<void>(resolve => setTimeout(resolve, 0))
}

/** Exact Tailwind token membership (avoids `text-pm-text-muted` matching `text-pm-text`). */
function hasClass(el: Element | null, token: string): boolean {
  return (el?.getAttribute('class') ?? '').split(/\s+/).includes(token)
}

async function openMenu(mobile: boolean) {
  const { container } = render(UserMenu, { props: { user, mobile } })
  fireEvent.click(screen.getByRole('button', { name: 'User menu' }))
  await tick()
  return container
}

afterEach(cleanup)

describe('UserMenu — mobile variant (PM2 mobile-user-menu parity)', () => {
  it('renders the info block with large bold name and larger email/role', async () => {
    await openMenu(true)

    const name = screen.getByText('Developer')
    expect(hasClass(name, 'text-base')).toBe(true)
    expect(hasClass(name, 'font-bold')).toBe(true)

    const email = screen.getByText('dev@example.com')
    expect(hasClass(email, 'text-sm')).toBe(true)
    const role = screen.getByText('editor')
    expect(hasClass(role, 'text-sm')).toBe(true)
  })

  it('keeps the desktop info block compact (name sm, email/role xs)', async () => {
    await openMenu(false)

    const name = screen.getByText('Developer')
    expect(hasClass(name, 'text-sm')).toBe(true)
    expect(hasClass(name, 'text-base')).toBe(false)
    const email = screen.getByText('dev@example.com')
    expect(hasClass(email, 'text-xs')).toBe(true)
  })

  it('shows ONE settings row: theme toggle (sun icon) + inline language codes, no text labels', async () => {
    const container = await openMenu(true)

    // No "Language"/"Theme" text labels anywhere in the dropdown — the old
    // layout rendered them as separate rows (the narrow label column wrapped).
    expect(screen.queryByText('Language')).toBeNull()
    expect(screen.queryByText('Theme')).toBeNull()

    // The theme toggle button lives in the same row as the language codes.
    const themeButton = screen.getByRole('button', { name: 'Theme' })
    const langButtons = container.querySelectorAll('.lang-switcher-option')
    expect(langButtons.length).toBeGreaterThanOrEqual(4)

    const settingsRow = themeButton.closest('.flex.items-center.justify-between')
    expect(settingsRow).not.toBeNull()
    expect(settingsRow?.querySelector('.lang-switcher-option')).not.toBeNull()
  })

  it('keeps Change Password bright and Logout accent-red', async () => {
    await openMenu(true)

    const changePassword = screen.getByRole('link', { name: 'Change Password' })
    expect(hasClass(changePassword, 'text-pm-text')).toBe(true)
    expect(hasClass(changePassword, 'text-pm-text-muted')).toBe(false)

    const logout = screen.getByRole('button', { name: 'Logout' })
    expect(hasClass(logout, 'text-pm-danger')).toBe(true)
  })

  it('uses a roomy panel and compact theme button so the settings row fits (RTL overflow fix)', async () => {
    const container = await openMenu(true)

    // The dropdown panel must be wide/padded enough that the theme button +
    // the 4-code inline switcher stay inside the trailing edge in both
    // directions (a w-56/p-3 panel overflowed the HE chip in RTL).
    const panel = container.querySelector('[data-menu="user"] .absolute')
    expect(hasClass(panel, 'w-64')).toBe(true)
    expect(hasClass(panel, 'p-4')).toBe(true)

    // The compact p-1 theme button (replaces the default p-2) is what closes
    // the width gap that previously pushed the last chip out of the panel.
    const themeButton = screen.getByRole('button', { name: 'Theme' })
    expect(hasClass(themeButton, 'p-1')).toBe(true)
    expect(hasClass(themeButton, 'p-2')).toBe(false)

    // Breathing room: roomier block spacing around the dividers.
    const changePassword = screen.getByRole('link', { name: 'Change Password' })
    expect(hasClass(changePassword, 'py-2')).toBe(true)
  })
})
