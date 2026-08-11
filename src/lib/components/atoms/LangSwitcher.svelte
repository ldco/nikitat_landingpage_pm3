<script lang="ts">
  /**
   * LangSwitcher — Language switcher (ported from app-nuxt LangSwitcher.vue)
   * Behavioral parity with PM v2:
   *   - Client-side locale switch (matches Nuxt setLocale()): setLocale() from
   *     the reactive locale store updates the Paraglide RUNTIME locale AND the
   *     Svelte-reactive store (the runtime's languageTag() binding is not
   *     reactive, so components need the store to re-render), then goto()
   *     navigates to the localized URL with noScroll to preserve the section
   *   - noScroll keeps the current scroll position: switching language from a
   *     onepager section stays on the section instead of restarting at the top
   *     and animating down to the anchor
   *   - Shows ALL locales in dropdown (current + others), active gets highlight
   *   - Click-outside detection to close panel
   *   - SSR-safe (ClientOnly pattern: renders nothing until mounted)
   *   - Transition for panel open/close (CSS classes from lang-switcher.css)
   */
  import { availableLanguageTags } from '$lib/paraglide/runtime.js'
  import { goto } from '$app/navigation'
  import { isRtlLocale } from '$lib/config/site'
  import { localizeUrl } from '$lib/utils/navigation'
  import { currentLocale as getCurrentLocale, setLocale } from '$lib/stores/locale.svelte'
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

  const currentLocale = $derived(getCurrentLocale())

  // Shared option button styling — single source of truth for inline, side and
  // dropdown panel so the modes can't drift apart.
  const optionBase =
    'lang-switcher-option flex items-center justify-center min-w-10 h-9 px-2 rounded-sm text-xs font-bold leading-none whitespace-nowrap transition-colors duration-150 uppercase'
  const optionActive = 'bg-pm-brand text-pm-white'
  const optionIdle = 'bg-transparent text-pm-text-secondary hover:bg-pm-brand-subtle hover:text-pm-text'

  function selectLocale(code: string) {
    // PM v2 contract: switching language keeps the current page, section hash
    // and query state — localizeUrl() canonicalizes the pathname, re-applies
    // the target locale prefix and preserves `search` + `hash`. Switching from
    // `/#focus` in one language lands on `/<lang>/#focus`, not the page top.
    const target = localizeUrl(window.location.href, code)
    // Persist the chosen language in a preference cookie so locale-less
    // surfaces (the /admin/* area, which is excluded from URL-prefix locale
    // detection) render in the same language as the site.
    try {
      document.cookie = `pm-locale=${code}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
    } catch (e) {
      console.debug('[locale] preference cookie blocked:', e instanceof Error ? e.message : e)
    }
    panelOpen = false
    // Update the RUNTIME locale AND the reactive store explicitly. The app does
    // not mount ParaglideJS (whose $effect would sync the language tag + <html
    // lang>/dir on every navigation), and the paraglide runtime's languageTag()
    // binding is not Svelte-reactive — so goto() alone would leave the runtime
    // tag, the switcher label and every languageTag()-derived string in the OLD
    // language. setLocale() makes the switch reactive: nav links, switcher
    // label, logo assets and translated content all re-render immediately.
    setLocale(code)
    // Keep the DOM <html lang>/dir in sync (client-side navigation does not
    // re-run SSR, so the attribute would otherwise stay at the bootstrap value).
    document.documentElement.lang = code
    document.documentElement.dir = isRtlLocale(code) ? 'rtl' : 'ltr'
    // Client-side navigation (PM2 parity — no hard reload). `noScroll` makes
    // SvelteKit restore the CURRENT scroll position instead of scrolling to the
    // hash, so a locale switch on an onepager section stays on the section:
    // no top-of-page restart, no smooth scroll-down animation to the anchor.
    // `invalidateAll` re-fetches the page data: the paraglide reroute maps the
    // localized URL ('/en/') to the SAME route ('/'), so without it SvelteKit
    // treats the navigation as same-page and keeps the OLD locale's data (the
    // DB content translations would not switch). invalidateAll forces the load
    // to re-run against the new URL, returning the new locale's data.
    void goto(target, { noScroll: true, invalidateAll: true })
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
