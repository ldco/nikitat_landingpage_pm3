<script lang="ts">
  /**
   * LangSwitcher — Language switcher (ported from app-nuxt LangSwitcher.vue)
   * Behavioral parity with PM v2:
   *   - Uses goto() with i18n.resolveRoute() for locale switch (matches setLocale())
   *   - Shows ALL locales in dropdown (current + others), active gets highlight
   *   - Click-outside detection to close panel
   *   - SSR-safe (ClientOnly pattern: renders nothing until mounted)
   *   - Transition for panel open/close (CSS classes from lang-switcher.css)
   */
      import { page } from '$app/stores'
  import { availableLanguageTags, languageTag } from '$lib/paraglide/runtime.js'
  import type { AvailableLanguageTag } from '$lib/paraglide/runtime.js'
  import { i18n } from '$lib/i18n'
  import { t } from '$lib/stores/content.svelte'
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  type Mode = 'down' | 'side' | 'inline'

  interface Props {
    mode?: Mode
    class?: string
  }

  let { mode = 'down', class: className = '' }: Props = $props()

  let panelOpen = $state(false)
  // always render

  const currentLocale = $derived(languageTag())

  // Shared option button styling — single source of truth for inline, side and
  // dropdown panel so the modes can't drift apart.
  const optionBase =
    'lang-switcher-option flex items-center justify-center min-w-10 h-9 px-2 rounded-sm text-xs font-bold leading-none whitespace-nowrap transition-colors duration-150 uppercase'
  const optionActive = 'bg-pm-brand text-pm-white'
  const optionIdle = 'bg-transparent text-pm-text-secondary hover:bg-pm-brand-subtle hover:text-pm-text'

  function selectLocale(code: string) {
    const canonical = i18n.route($page.url.pathname)
    const resolved = i18n.resolveRoute(canonical, code as AvailableLanguageTag)
    window.location.href = resolved
  }

  function togglePanel() {
    panelOpen = !panelOpen
  }

  function handleClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement
    if (!target.closest('.lang-switcher-wrapper')) {
      panelOpen = false
    }
  }
</script>

{#if mode === 'inline'}
  <!-- ═══ INLINE MODE (PM v2: direction="inline") ═══ -->
  <div class={twMerge(clsx('lang-switcher-inline flex items-center gap-1', className))}>
    {#each availableLanguageTags as code}
      <button
        type="button"
        class={clsx(optionBase, code === currentLocale ? optionActive : optionIdle)}
        onclick={() => selectLocale(code)}
      >
        {code}
      </button>
    {/each}
  </div>

{:else if mode === 'side'}
  <!-- ═══ SIDE-BY-SIDE MODE (PM v2: direction="side") ═══ -->
  <div class={twMerge(clsx('lang-switcher--side flex items-center gap-1', className))}>
    {#each availableLanguageTags as code}
      <button
        type="button"
        class={clsx(optionBase, code === currentLocale ? optionActive : optionIdle)}
        onclick={() => selectLocale(code)}
      >
        {code}
      </button>
    {/each}
  </div>

{:else}
  <!-- ═══ DROPDOWN MODE (PM v2: direction="down") ═══ -->
  <div class={twMerge(clsx('lang-switcher-wrapper lang-switcher--down relative inline-flex', className))}>
    <button
      type="button"
      class="lang-switcher-btn flex items-center justify-center size-9 rounded-sm text-pm-text-secondary hover:bg-pm-bg-sunken hover:text-pm-text transition-colors duration-150"
      aria-expanded={panelOpen}
      title={t('common.language')}
      onclick={togglePanel}
    >
      <span class="lang-switcher-code inline-flex items-center justify-center text-sm font-bold uppercase tracking-wider leading-none">
        {currentLocale.toUpperCase()}
      </span>
    </button>

    {#if panelOpen}
      <!-- PM v2: shows ALL locales, current gets active class -->
      <div class="lang-switcher-panel absolute top-full end-0 mt-1 z-[var(--z-popover)] flex gap-1 p-2 bg-pm-bg-elevated border border-pm-border rounded-sm shadow-lg">
        {#each availableLanguageTags as code}
          <button
            type="button"
            class={clsx(optionBase, code === currentLocale ? optionActive : optionIdle)}
            onclick={() => selectLocale(code)}
          >
            {code}
          </button>
        {/each}
      </div>
    {/if}
  </div>
{/if}
