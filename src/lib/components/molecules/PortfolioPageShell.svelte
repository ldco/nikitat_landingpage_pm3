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
   * Rule #1: class prop + twMerge
   *
   * @props {string} title — page heading text
   * @props {string} [description=''] — optional subtitle under the heading
   * @props {string} [backHref] — optional back link (renders the nav.portfolio label)
   * @props {Snippet} [headerActions] — optional trailing header content (layout toggle)
   * @props {Snippet} children — page body
   * @props {string} [class] — merged via twMerge
   *
   * @example
   * <PortfolioPageShell title="Work" backHref="/portfolio">
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
    headerActions,
    children,
    class: className = ''
  }: {
    title: string
    description?: string
    backHref?: string
    headerActions?: import('svelte').Snippet
    children?: import('svelte').Snippet
    class?: string
  } = $props()
</script>

<Container class={twMerge(clsx('py-24', className))}>
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

  {@render children?.()}
</Container>
