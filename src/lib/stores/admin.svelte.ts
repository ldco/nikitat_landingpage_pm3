/**
 * Admin State Store (Svelte 5)
 *
 * Mirrors PM v2 app/stores/admin.ts (Pinia).
 * Tracks current admin section and sidebar visibility.
 *
 * NOTE: unread contact count is provided by the admin layout server load
 * (+layout.server.ts → data.unreadCount), not this store.
 */

let _currentSection = $state('dashboard')
let _sidebarOpen = $state(false)

export function getAdminState() {
  return {
    get currentSection() { return _currentSection },
    set currentSection(v: string) { _currentSection = v },
    get sidebarOpen() { return _sidebarOpen },
    set sidebarOpen(v: boolean) { _sidebarOpen = v },
    toggleSidebar() { _sidebarOpen = !_sidebarOpen }
  }
}
