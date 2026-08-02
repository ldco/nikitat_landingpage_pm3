/**
 * Project Component Registry — nikitat.pro
 *
 * Maps framework component names to project-specific implementations.
 * The framework (SectionRenderer, +layout.svelte) checks this registry first.
 * If a project component is registered, it's used instead of the framework default.
 *
 * To add a project override: register it here, keep the file in src/project/.
 */
import FallingLetters from './FallingLetters.svelte'
import HeroParallaxScene from './HeroParallaxScene.svelte'
import SectionF22 from './SectionF22.svelte'

/**
 * Component name → project implementation.
 * Framework uses this map to resolve section components.
 */
export const PROJECT_SECTION_COMPONENTS: Record<string, unknown> = {
  SectionF22
}

/**
 * Ambient effects rendered in the root layout (project-specific).
 * Framework +layout.svelte renders these conditionally via FEATURES flags.
 */
export const PROJECT_AMBIENT = {
  FallingLetters
}

/**
 * Project-specific scene components (e.g. hero parallax).
 * Framework SectionHero checks heroParallax feature + this registry.
 */
export const PROJECT_SCENES = {
  HeroParallaxScene
}

export default { PROJECT_SECTION_COMPONENTS, PROJECT_AMBIENT, PROJECT_SCENES }
