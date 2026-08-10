<script lang="ts">
  /**
   * OnepagerThreeStoryScene — Reserved scrollytelling scene extension point
   *
   * PM v2 parity: app-nuxt/app/components/organisms/OnepagerThreeStoryScene.vue
   * (reserved for premium onepager scenes driven by the scrollytelling engine).
   *
   * v3 implements the same contract with the use:scrollyScene action:
   * each scene reads `--pm-scene-progress` (0→1) from the CSS custom property
   * set by scrollyScene.ts, so content can be animated per scroll position.
   *
   * 🔮 PERFORMANCE CONTRACT (keep when filling in content):
   * - Use `position: fixed` for the visual layer — no layout recalculations
   * - Use `pointer-events: none` on the visual layer — content stays interactive
   * - Check `prefers-reduced-motion` before enabling heavy animations
   * - Monitor `--pm-scene-progress` for animation timing
   * - Ensure a static fallback is served when motion is reduced
   *
   * @props {Array<{ id: string; title?: string; body?: string }>} [scenes] — scene content
   * @props {string} [class] — merged via twMerge
   *
   * @example <OnepagerThreeStoryScene scenes={[{ id: 'one' }, { id: 'two' }, { id: 'three' }]} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { scrollyScene } from '$lib/actions/scrollyScene'

  let {
    scenes = [] as Array<{ id: string; title?: string; body?: string }>,
    class: className = ''
  }: {
    scenes?: Array<{ id: string; title?: string; body?: string }>
    class?: string
  } = $props()
</script>

{#if scenes.length > 0}
  <div class={twMerge(clsx('relative', className))} role="region" aria-label="Story">
    {#each scenes as scene, index}
      <section
        use:scrollyScene
        id={scene.id}
        class="relative min-h-screen flex items-center justify-center overflow-hidden"
        aria-label={scene.title ?? `${index + 1}`}
      >
        <div
          class="pointer-events-none fixed inset-0 z-0"
          style={`opacity: calc(var(--pm-scene-progress) * 1)`}
          aria-hidden="true"
        >
          <!-- Visual layer — replaced by project-specific scrollytelling content -->
        </div>
        <div class="relative z-10 max-w-[var(--max-w-content)] px-[var(--px-container)] text-center">
          {#if scene.title}
            <h2 class="text-fluid-3xl font-bold text-pm-text">{scene.title}</h2>
          {/if}
          {#if scene.body}
            <p class="mt-4 text-fluid-base text-pm-text-secondary">{scene.body}</p>
          {/if}
        </div>
      </section>
    {/each}
  </div>
{:else}
  <!-- Reserved extension point: renders nothing until a project supplies scenes -->
{/if}
