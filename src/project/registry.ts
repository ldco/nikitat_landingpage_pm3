/**
 * Project Registry — nikitat.pro
 *
 * Single registration point for project-specific components that extend
 * the PM3 framework catalog. Each export has exactly ONE framework consumer.
 *
 * To add a custom section:
 *   1. Create it in src/project/sections/
 *   2. Register it here under its component name
 *   3. Add it to HOMEPAGE_SECTIONS in site-config.ts
 *
 * Framework consumers:
 *   PROJECT_SECTIONS  → sections/registry.ts  → SectionRenderer
 */
import type { Component } from 'svelte'
import SectionF22 from './SectionF22.svelte'

/**
 * Project-specific section components added to the framework section catalog.
 * Keys are component names configured in HOMEPAGE_SECTIONS[].component.
 */
export const PROJECT_SECTIONS: Record<string, Component> = {
  SectionF22
}
