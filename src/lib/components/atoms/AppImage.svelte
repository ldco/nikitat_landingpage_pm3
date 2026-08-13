<script lang="ts">
  /**
   * AppImage — Image with loading/error states and fallback
   * Rule #1: class prop + twMerge
   *
   * @props {string} src — image source URL
   * @props {string} [alt=''] — alt text
   * @props {string} [fallback='/images/placeholder.svg'] — shown on load error
   * @props {'lazy'|'eager'} [loading='lazy'] — native img loading attribute
   * @props {string} [class] — additional CSS classes merged via twMerge
   *
   * @example
   * <AppImage src="/images/photo.jpg" alt={t('common.photo')} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  let {
    src,
    alt = '',
    fallback = '/images/placeholder.svg',
    class: className = '',
    loading = 'lazy' as const
  }: {
    src: string
    alt?: string
    fallback?: string
    class?: string
    loading?: 'lazy' | 'eager'
  } = $props()

  let loaded = $state(false)
  let error = $state(false)

  function onLoad() {
    loaded = true
  }

  function onError() {
    error = true
    loaded = true
  }

  const base = 'transition-opacity duration-300'
</script>

{#if error}
  <img src={fallback} {alt} class={twMerge(clsx(base, 'opacity-60', className))} />
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
