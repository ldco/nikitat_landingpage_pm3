/**
 * Navigation State — Active section tracking for ScrollSpy
 *
 * Shared reactive state between ScrollSpy action and TheHeader.
 * The action writes the active section, TheHeader reads it for nav highlighting.
 */
let _activeSection = $state('')

export function getNavState() {
  return {
    get activeSection() { return _activeSection },
    set activeSection(id: string) { _activeSection = id }
  }
}
