<script lang="ts">
  /**
   * ThemeToggle — Light/dark mode switch with View Transitions API animation
   *
   * Ported from app-nuxt/app/components/atoms/ThemeToggle.vue (134 lines)
   * Behavioral parity:
   * - Circle reveal animation from click position (View Transitions API)
   * - Falls back instantly if API unsupported or prefers-reduced-motion
   * - Icon transition (sun <-> moon) via Svelte transition
   * - SSR-safe: renders placeholder until hydrated
   * - Cookie consent integration for preference persistence
   *
   * @props {string} [class] — additional CSS classes merged via twMerge
   *
   * @example
   * <ThemeToggle />
   */
  import { browser } from '$app/environment'
  import { getTheme } from '$lib/stores/theme.svelte'
  import { t } from '$lib/stores/content.svelte'
  import IconSun from '@tabler/icons-svelte/icons/sun'
  import IconMoon from '@tabler/icons-svelte/icons/moon'
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  interface Props {
    class?: string
  }

  let { class: className = '' }: Props = $props()

  const theme = getTheme()
  const isDark = $derived(theme.current === 'dark')

  // Hydration guard — only render interactive button after mount
  let mounted = $state(false)
  $effect(() => { if (browser) mounted = true })

  // CSS classes matching PM v2 action-surface styling
  const base = 'inline-flex items-center justify-center rounded-md p-2 text-pm-text-secondary hover:text-pm-brand hover:bg-pm-bg-sunken transition-colors duration-150'

  /**
   * Toggle theme with View Transitions API circle reveal animation.
   * Matches app-nuxt ThemeToggle.vue lines 35-99 exactly.
   */
  async function toggleTheme(event: MouseEvent) {
    if (!browser) return

    const newTheme: 'light' | 'dark' = theme.current === 'dark' ? 'light' : 'dark'

    function applyThemePreference() {
      // Toggle .dark class directly on html (this is what View Transitions snapshots)
      document.documentElement.classList.toggle('dark', newTheme === 'dark')
      // Update Svelte state — Svelte won't re-render during active View Transition
      theme.set(newTheme)
    }

    // Check if View Transitions API is supported and motion is allowed
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const supportsViewTransitions = 'startViewTransition' in document

    if (!supportsViewTransitions || prefersReducedMotion) {
      applyThemePreference()
      return
    }

    // Get click coordinates for circle origin
    const x = event.clientX
    const y = event.clientY

    // Calculate the maximum radius needed to cover the entire screen
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    // Set CSS custom properties for the animation origin
    document.documentElement.style.setProperty('--theme-toggle-x', `${x}px`)
    document.documentElement.style.setProperty('--theme-toggle-y', `${y}px`)
    document.documentElement.style.setProperty('--theme-toggle-radius', `${endRadius}px`)

    // Start the view transition — TypeScript 5.x includes startViewTransition in DOM lib
    const transition = document.startViewTransition(() => {
      applyThemePreference()
    })

    // Wait for transition to be ready, then run animation
    await transition.ready

    // Animate the new view with a circle clip-path
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`
        ]
      },
      {
        duration: 400,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        pseudoElement: '::view-transition-new(root)'
      }
    )
  }
</script>

{#if mounted}
  <button
    type="button"
    class={twMerge(clsx(base, className))}
    onclick={toggleTheme}
    aria-label={t('common.theme')}
  >
    <span class="theme-toggle-icon-wrapper relative size-5">
      <IconSun
        class={clsx('absolute inset-0 size-5 transition-all duration-300',
          isDark ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90'
        )}
      />
      <IconMoon
        class={clsx('absolute inset-0 size-5 transition-all duration-300',
          !isDark ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 rotate-90'
        )}
      />
    </span>
  </button>
{:else}
  <!-- SSR fallback — matches PM v2 ClientOnly fallback -->
  <button type="button" class={twMerge(clsx(base, className))} aria-label={t('common.theme')}>
    <IconSun class="size-5" />
  </button>
{/if}
