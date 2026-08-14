<script lang="ts">
  /**
   * PortfolioCard — PM2-style portfolio preview card (six-image collage / cover / placeholder + hover info)
   *
   * Shared by the dedicated `/portfolio` listing page and the SectionPortfolio
   * framework section so both surfaces stay visually and behaviorally aligned
   * (docs/archive/pm-v2/portfolio-display-modes.md listing contract):
   *   1. six-image collage from the first six item thumbnails when available
   *   2. cover image fallback
   *   3. IconPhoto placeholder
   * The explanatory copy (portfolio description) and the title live in a hover
   * info layer that slides up over the preview (always visible on small
   * screens, matching the PM2 hover-reveal interaction). Every card links
   * with `portfolios.slug`.
   *
   * Rule #1: class prop + twMerge
   *
   * @props {PortfolioCard} card — portfolio card data (id, slug, name, type, description, coverImageUrl, thumbnails)
   * @props {string} [class] — additional CSS classes merged via twMerge
   *
   * @example
   * {#each portfolios as card}
   *   <PortfolioCard {card} />
   * {/each}
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import AppImage from '$lib/components/atoms/AppImage.svelte'
  import IconPhoto from '@tabler/icons-svelte/icons/photo'
  import { localizedHref } from '$lib/utils/navigation'
  import { currentLocale } from '$lib/stores/locale.svelte'
  import type { PortfolioCard as PortfolioCardData } from '$lib/components/sections/types'

  let {
    card,
    class: className = ''
  }: {
    card: PortfolioCardData
    class?: string
  } = $props()

  const locale = $derived(currentLocale())
  const href = $derived(localizedHref(`/portfolio/${card.slug}`, locale))
</script>

<a
  {href}
  class={twMerge(clsx(
    'group relative block overflow-hidden rounded-[var(--radius-xl)] border border-pm-border bg-pm-bg',
    'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pm-focus-ring',
    className
  ))}
>
  <!-- Image area: six-image collage → cover → placeholder -->
  <div class="relative aspect-16/10 overflow-hidden bg-pm-bg-sunken">
    {#if card.thumbnails.length > 0}
      <div class="grid h-full w-full grid-cols-3 grid-rows-2 gap-0.5">
        {#each card.thumbnails.slice(0, 6) as url, i (i)}
          <AppImage
            src={url}
            alt={card.name}
            class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        {/each}
      </div>
    {:else if card.coverImageUrl}
      <AppImage
        src={card.coverImageUrl}
        alt={card.name}
        class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    {:else}
      <div class="flex h-full w-full items-center justify-center">
        <IconPhoto class="size-10 text-pm-text-muted" />
      </div>
    {/if}

    <!-- Hover gradient over the preview (revealed on hover AND keyboard
         focus; always visible on small screens) -->
    <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 max-sm:opacity-100"></div>

    <!-- Hover info layer: title + explanatory copy from the description,
         sliding up over the preview (PM v2 hover-reveal; also revealed on
         keyboard focus so focused desktop users can read the label, and
         always visible on small screens where there is no hover state). -->
    <div class="absolute inset-x-0 bottom-0 translate-y-full p-4 transition-transform duration-200 group-hover:translate-y-0 group-focus-visible:translate-y-0 max-sm:translate-y-0">
      <h3 class="text-lg font-bold text-pm-white leading-tight">{card.name}</h3>
      {#if card.description}
        <p class="mt-1 line-clamp-2 text-sm text-pm-white/85 leading-relaxed">{card.description}</p>
      {/if}
    </div>
  </div>
</a>
