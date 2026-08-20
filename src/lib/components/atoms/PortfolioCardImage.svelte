<script lang="ts">
  /**
   * PortfolioCardImage — portfolio card preview image area (cover / six-image collage / placeholder)
   *
   * THE single source of truth for how a portfolio card's image area renders.
   * Shared by the public PortfolioCard molecule and the admin PortfolioCardPreview
   * so the admin editor shows EXACTLY what visitors see:
   *   1. explicitly uploaded cover image (takes priority)
   *   2. six-image collage from the first six item thumbnails
   *   3. IconPhoto placeholder
   *
   * Rule #1: class prop + twMerge
   *
   * @props {string|null} [coverImageUrl=null] — explicit admin-uploaded cover (takes priority)
   * @props {string[]} [thumbnails=[]] — first six item thumbnails (collage fallback)
   * @props {string} [alt=''] — alt text for the images
   * @props {string} [class] — additional CSS classes merged via twMerge
   *
   * @example
   * <PortfolioCardImage coverImageUrl={card.coverImageUrl} thumbnails={card.thumbnails} alt={card.name} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import AppImage from '$lib/components/atoms/AppImage.svelte'
  import IconPhoto from '@tabler/icons-svelte/icons/photo'

  let {
    coverImageUrl = null,
    thumbnails = [] as string[],
    alt = '',
    class: className = ''
  }: {
    coverImageUrl?: string | null
    thumbnails?: string[]
    alt?: string
    class?: string
  } = $props()
</script>

<div class={twMerge(clsx('relative aspect-16/10 overflow-hidden bg-pm-bg-sunken', className))}>
  {#if coverImageUrl}
    <AppImage
      src={coverImageUrl}
      {alt}
      class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
  {:else if thumbnails.length > 0}
    <div class="grid h-full w-full grid-cols-3 grid-rows-2 gap-0.5">
      {#each thumbnails.slice(0, 6) as url, i (i)}
        <AppImage
          src={url}
          {alt}
          class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      {/each}
    </div>
  {:else}
    <div class="flex h-full w-full items-center justify-center">
      <!-- text-pm-text-secondary (not muted): the placeholder is a graphic on
           bg-pm-bg-sunken and must meet the 3:1 non-text contrast threshold —
           muted is only ~2.6:1 there (axe color-contrast violation) -->
      <IconPhoto class="size-10 text-pm-text-secondary" />
    </div>
  {/if}
</div>
