<script lang="ts">
  /**
   * PortfolioPageShell — shared page chrome for the portfolio listing + detail pages
   *
   * Centralizes the canonical layout/heading primitives (Container +
   * SectionHeading) plus the back link and page header, so /portfolio and
   * /portfolio/[slug] never hand-roll width wrappers or heading bundles. The
   * header keeps the title + optional description on the start edge and any
   * trailing actions (e.g. the branding layout toggle) on the end edge.
   *
   * The header chrome and the page body are SEPARATE layout regions: the header
   * always renders in the default contained Container, while the body renders
   * in `bodyWidth` ('default' | 'bleed'). Branding fullscreen slides pass
   * `bodyWidth="bleed"` so they span the full viewport width with no max-width
   * and no horizontal container padding — the back-link and title presentation
   * stay contained regardless.
   *
   * Rule #1: class prop + twMerge
   *
   * @props {string} title — page heading text
   * @props {string} [description=''] — optional subtitle under the heading
   * @props {string} [backHref] — optional back link (renders the nav.portfolio label)
   * @props {'default'|'bleed'} [bodyWidth='default'] — body region width ('bleed' = edge-to-edge)
   * @props {Snippet} [headerActions] — optional trailing header content (layout toggle)
   * @props {Snippet} children — page body
   * @props {string} [class] — merged via twMerge
   *
   * @example
   * <PortfolioPageShell title="Work" backHref="/portfolio" bodyWidth="bleed">
   *   <PortfolioCard {card} />
   * </PortfolioPageShell>
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import Container from '$lib/components/atoms/Container.svelte'
  import SectionHeading from '$lib/components/molecules/SectionHeading.svelte'
  import { t } from '$lib/stores/content.svelte'
  import IconArrowLeft from '@tabler/icons-svelte/icons/arrow-left'

  let {
    title,
    description = '',
    backHref,
    bodyWidth = 'default',
    headerActions,
    children,
    class: className = ''
  }: {
    title: string
    description?: string
    backHref?: string
    bodyWidth?: 'default' | 'bleed'
    headerActions?: import('svelte').Snippet
    children?: import('svelte').Snippet
    class?: string
  } = $props()
</script>

<div class={twMerge(clsx('w-full', className))}>
  <!-- Contained header chrome (back link + title + description + actions) -->
  <Container class="pt-24 pb-12">
    {#if backHref}
      <a
        href={backHref}
        class="inline-flex items-center gap-2 text-sm text-pm-text-muted hover:text-pm-brand transition-colors mb-8"
      >
        <IconArrowLeft class="size-4" />
        {t('nav.portfolio')}
      </a>
    {/if}

    <header class="flex flex-wrap items-end justify-between gap-6 mb-12">
      <div class="min-w-0">
        <SectionHeading title={title} align={backHref ? 'start' : 'center'} />
        {#if description}
          <p class={clsx('max-w-2xl text-lg text-pm-text-secondary', backHref ? '' : 'text-center mx-auto')}>
            {description}
          </p>
        {/if}
      </div>
      {#if headerActions}
        {@render headerActions()}
      {/if}
    </header>
  </Container>

  <!-- Body region: contained by default, full-bleed for the branding fullscreen
       slides (no max-width, no horizontal/vertical container padding). -->
  <Container width={bodyWidth} class={bodyWidth === 'bleed' ? '' : 'pb-24'}>
    {@render children?.()}
  </Container>
</div>
