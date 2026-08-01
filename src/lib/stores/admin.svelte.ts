/**
 * Admin State Store (Svelte 5)
 *
 * Mirrors PM v2 app/stores/admin.ts (Pinia).
 * Tracks current admin section, sidebar visibility, and unread contact count.
 */

let _currentSection = $state('dashboard')
let _sidebarOpen = $state(false)
let _unreadCount = $state(0)

export function getAdminState() {
  return {
    get currentSection() { return _currentSection },
    set currentSection(v: string) { _currentSection = v },
    get sidebarOpen() { return _sidebarOpen },
    set sidebarOpen(v: boolean) { _sidebarOpen = v },
    toggleSidebar() { _sidebarOpen = !_sidebarOpen },
    get unreadCount() { return _unreadCount },
    set unreadCount(v: number) { _unreadCount = v }
  }
}
