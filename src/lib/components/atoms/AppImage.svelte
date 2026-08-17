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

  let loaded = $state(false)
  let error = $state(false)

  // Reset the load state whenever the src changes (PM v2 AppImage `watch`):
  // the effect depends on `src` and runs before the DOM update, so a new src
  // always renders as a fresh image attempt instead of inheriting a previous
  // src's error state.
  $effect.pre(() => {
    const current = src
    loaded = false
    error = false
  })

  function onLoad() {
    loaded = true
  }

  function onError() {
    error = true
    loaded = true
  }

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
    {src}
    {alt}
    {loading}
    class={twMerge(clsx(base, loaded ? 'opacity-100' : 'opacity-0', className))}
    onload={onLoad}
    onerror={onError}
  />
{/if}
