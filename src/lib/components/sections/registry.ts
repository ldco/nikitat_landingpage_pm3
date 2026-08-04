/**
 * Section Registry — Single source of truth for section-to-component mapping
 *
 * PM3 framework primitive (ADR-003). Merges:
 *   - FRAMEWORK_SECTIONS: built-in section components
 *   - PROJECT_SECTIONS: project-specific sections (src/project/registry.ts)
 *
 * Projects add custom sections by registering them in their registry,
 * NOT by editing framework files. If a project key shadows a framework key,
 * the project component wins (true override).
 */
import type { Component } from 'svelte'
import SectionAbout from './SectionAbout.svelte'
import SectionFocus from './SectionFocus.svelte'
import SectionPortfolio from './SectionPortfolio.svelte'
import SectionContact from './SectionContact.svelte'
import SectionBlog from './SectionBlog.svelte'
import SectionFeatures from './SectionFeatures.svelte'
import SectionFaq from './SectionFaq.svelte'
import SectionPricing from './SectionPricing.svelte'
import SectionTeam from './SectionTeam.svelte'
import SectionTestimonials from './SectionTestimonials.svelte'
import SectionClients from './SectionClients.svelte'
import { PROJECT_SECTIONS } from '../../../project/registry'

const FRAMEWORK_SECTIONS: Record<string, Component> = {
  SectionAbout,
  SectionFocus,
  SectionPortfolio,
  SectionContact,
  SectionBlog,
  SectionFeatures,
  SectionFaq,
  SectionPricing,
  SectionTeam,
  SectionTestimonials,
  SectionClients
}

/**
 * Merged catalog: project sections extend the framework catalog.
 * Project keys shadowing framework keys act as true overrides.
 */
export const SECTION_REGISTRY: Record<string, Component> = {
  ...FRAMEWORK_SECTIONS,
  ...PROJECT_SECTIONS
}
