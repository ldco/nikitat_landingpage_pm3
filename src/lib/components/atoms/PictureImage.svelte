<script lang="ts">
  /**
   * PictureImage — Responsive image with AVIF/WebP fallback
   * Rule #1: class prop + twMerge
   *
   * Converts src path to use modern formats:
   *   /images/photo.jpg → AVIF preferred, WebP fallback, original as last resort
   *
   * @props {string} src — source image path
   * @props {string} [alt=''] — alt text
   * @props {number[]} [widths=[400, 800, 1200]] — responsive srcset widths
   * @props {string} [class] — additional CSS classes merged via twMerge
   *
   * @example
   * <PictureImage src="/images/photo.jpg" alt={t('common.photo')} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  let {
    src,
    alt = '',
    widths = [400, 800, 1200],
    class: className = ''
  }: {
    src: string
    alt?: string
    widths?: number[]
    class?: string
  } = $props()

  // Derive base path without extension
  const basePath = $derived(src.replace(/\.\w+$/, ''))

  // Build srcSet for a given extension
  function srcSet(ext: string): string {
    return widths.map(w => `${basePath}-${w}.${ext} ${w}w`).join(', ')
  }

  const base = 'max-w-full h-auto'
</script>

<picture>
  {#each ['avif', 'webp'] as fmt}
    <source type={`image/${fmt}`} srcset={srcSet(fmt)} />
  {/each}
  <img src={src} {alt} class={twMerge(clsx(base, className))} loading="lazy" />
</picture>
