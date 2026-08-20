<script lang="ts">
  /**
   * AppImage — Image with loading/error states and an in-component placeholder
   * Rule #1: class prop + twMerge
   *
   * PM v2 (Vue) parity: the image is COMPLETELY removed on load error and a
   * themed in-component placeholder (IconPhoto) is shown instead — never a
   * broken-image icon and never a second network fetch to a fallback asset.
   * Load state resets reactively whenever `src` changes, so a new src is
   * always attempted even after a previous src failed (a failed first gallery
   * image must not poison later slides).
   *
   * CSP note: the load/error state is tracked with native listeners attached
   * from an $effect instead of Svelte's onload/onerror attributes. Svelte's
   * SSR compiler emits those as inline attributes (`onload="this.__e=event"`)
   * on load/error elements, and the site's nonce-only script-src CSP blocks
   * them — losing the pre-hydration load events. A complete/decode replay
   * recovers the outcome for images that finished before hydration.
   *
   * @props {string|null} [src=null] — image source URL (null/empty → placeholder)
   * @props {string} [alt=''] — alt text
   * @props {'lazy'|'eager'} [loading='lazy'] — native img loading attribute
   * @props {string} [class] — additional CSS classes merged via twMerge
   *
   * @example
   * <AppImage src="/images/photo.jpg" alt={t('common.photo')} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import IconPhoto from '@tabler/icons-svelte/icons/photo'

  let {
    src = null,
    alt = '',
    class: className = '',
    loading = 'lazy' as const
  }: {
    src?: string | null
    alt?: string
    class?: string
    loading?: 'lazy' | 'eager'
  } = $props()

  let imgEl = $state<HTMLImageElement | null>(null)
  let loaded = $state(false)
  let error = $state(false)

  // Reset the load state whenever the src changes (PM v2 AppImage `watch`).
  // Deliberately depends ONLY on `src`: resetting here must not be undone by
  // the listener effect re-running when the error state swaps the img for the
  // placeholder (that would clear the very error it just set).
  $effect.pre(() => {
    const current = src
    loaded = false
    error = false
  })

  $effect(() => {
    const img = imgEl
    if (!img) return

    const markLoaded = () => {
      loaded = true
    }
    const markError = () => {
      error = true
      loaded = true
    }

    img.addEventListener('load', markLoaded)
    img.addEventListener('error', markError)

    // The load/error event can fire before hydration (SSR'd eagerly-loaded
    // images). Native listeners miss it, so replay the outcome: complete=true
    // means the attempt finished. decode() resolves for any decodable image
    // (including SVGs without intrinsic dimensions) and rejects for broken
    // images; naturalWidth is only the fallback where decode() is unavailable.
    if (img.complete) {
      if (typeof img.decode === 'function') {
        img.decode().then(markLoaded).catch(markError)
      } else if (img.naturalWidth > 0) {
        markLoaded()
      } else {
        markError()
      }
    }

    return () => {
      img.removeEventListener('load', markLoaded)
      img.removeEventListener('error', markError)
    }
  })

  const base = 'transition-opacity duration-300'
</script>

{#if error || !src}
  <div
    class={twMerge(clsx('flex items-center justify-center bg-pm-bg-sunken text-pm-text-muted', className))}
    role="img"
    aria-label={alt}
  >
    <IconPhoto class="size-8" />
  </div>
{:else}
  <img
    bind:this={imgEl}
    {src}
    {alt}
    {loading}
    class={twMerge(clsx(base, loaded ? 'opacity-100' : 'opacity-0', className))}
  />
{/if}
