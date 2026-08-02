<script lang="ts">
  /**
   * ProjectAmbient — Project-specific ambient effects for the root layout
   *
   * Framework +layout.svelte renders this component (not framework-specific
   * effects). This file lives in src/project/ so each PM3 site can customize
   * its ambient visual identity without editing framework files.
   *
   * @example <ProjectAmbient />
   */
  import { FEATURES } from '$lib/config/site'
  import FallingLetters from './FallingLetters.svelte'
</script>

{#if FEATURES.scrollytelling}
  <FallingLetters />
{/if}
