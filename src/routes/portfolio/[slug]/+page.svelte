<script lang="ts">
  /**
   * Portfolio Detail — Item grid + per-item subtype viewer (PM v2 detail contract)
   *
   * PM v2 parity (`docs/archive/pm-v2/portfolio-display-modes.md`):
   *   - branding:  fullscreen slides by default, grid via a layout toggle
   *   - website:   grid with image cards (info always visible)
   *   - case_study: grid with text-only cards
   *   - brandbook / gallery: grid with image cards
   *
   * The page renders a REAL item grid from `items` and keeps explicit
   * selected-item + open state. ONE item at a time is passed into the
   * subtype viewer (BrandingViewer/WebsiteViewer/BrandbookViewer/
   * CaseStudyViewer) — no portfolio-wide merged payload is built here.
   *
   * Rule #1: class prop + twMerge
   */
  import AppImage from '$lib/components/atoms/AppImage.svelte'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import EmptyState from '$lib/components/atoms/EmptyState.svelte'
  import Seo from '$lib/components/atoms/Seo.svelte'
  import PortfolioPageShell from '$lib/components/molecules/PortfolioPageShell.svelte'
  import { t } from '$lib/stores/content.svelte'
  import { localizedHref } from '$lib/utils/navigation'
  import { currentLocale } from '$lib/stores/locale.svelte'
  import IconX from '@tabler/icons-svelte/icons/x'
  import IconPhoto from '@tabler/icons-svelte/icons/photo'
  import WebsiteViewer from '$lib/plugins/portfolio/WebsiteViewer.svelte'
  import BrandingViewer from '$lib/plugins/portfolio/BrandingViewer.svelte'
  import CaseStudyViewer from '$lib/plugins/portfolio/CaseStudyViewer.svelte'
  import BrandbookViewer from '$lib/plugins/portfolio/BrandbookViewer.svelte'
  import type { PortfolioViewerItem } from '$lib/plugins/portfolio/types'
  import type { PageData } from './$types'
  let { data }: { data: PageData } = $props()
  const { portfolio, items } = $derived(data)
  const backHref = $derived(localizedHref('/portfolio', currentLocale()))

  const viewerItems = $derived<PortfolioViewerItem[]>(
    items.map(i => ({
      id: i.id,
      itemType: i.itemType,
      title: i.title,
      caption: i.caption,
      description: i.description,
      content: i.content,
      category: i.category,
      tags: i.tags,
      mediaUrl: i.mediaUrl,
      thumbnailUrl: i.thumbnailUrl,
      metadata: i.metadata
    }))
  )

  const isBranding = $derived(portfolio.type === 'branding')
  const isCaseStudy = $derived(portfolio.type === 'case_study')
  const isInfoVisible = $derived(portfolio.type === 'website')

  // Display mode (PM v2): branding defaults to fullscreen slides and can
  // toggle to a grid; every other type is grid-only. State is keyed to the
  // current portfolio so client-side navigation between two portfolios resets
  // selection/viewer/layout instead of leaking the previous portfolio's state.
  let layoutMode = $state<'fullscreen' | 'grid'>(
    portfolio.type === 'branding' ? 'fullscreen' : 'grid'
  )
  let selectedIndex = $state(0)
  let viewerOpen = $state(true)
  const selectedItem = $derived(viewerItems[selectedIndex] ?? null)

  // The branding fullscreen browser renders one h-dvh slide per item. Bounding
  // the server-rendered slide window keeps the SSR payload constant for huge
  // portfolios; the remaining slides materialize client-side after hydration.
  const SSR_SLIDE_CAP = 12
  let hydrated = $state(false)
  $effect(() => {
    hydrated = true
  })

  $effect(() => {
    // Depends on the current portfolio id + type: client-side navigation to
    // another portfolio resets selection, viewer state and the layout mode.
    const key = `${portfolio.id}:${portfolio.type}`
    void key
    layoutMode = portfolio.type === 'branding' ? 'fullscreen' : 'grid'
    selectedIndex = 0
    viewerOpen = true
  })

  function toggleLayout() {
    layoutMode = layoutMode === 'fullscreen' ? 'grid' : 'fullscreen'
  }

  function selectItem(index: number) {
    selectedIndex = index
    viewerOpen = true
    // In the immersive fullscreen browser the detail panel sits below the
    // slides — bring it into view so the selection is immediately visible.
    if (layoutMode === 'fullscreen') {
      document.getElementById('portfolio-detail-panel')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  }
</script>

<!-- Shared metadata contract: item name + description (site name composed by Seo). -->
<Seo title={portfolio.name} description={portfolio.description ?? undefined} />

<PortfolioPageShell
  title={portfolio.name}
  description={portfolio.description ?? ''}
  backHref={backHref}
>
  {#snippet headerActions()}
    {#if isBranding}
      <CtaButton variant="secondary" size="sm" onclick={toggleLayout}>
        {t('portfolio.toggleLayout', 'Switch layout')}
      </CtaButton>
    {/if}
  {/snippet}

  {#if viewerItems.length === 0}
    <EmptyState title={portfolio.name} description={t('portfolio.noItems')} />
  {:else}
    {#if layoutMode === 'fullscreen' && isBranding}
      <!-- Fullscreen slides (branding): item thumbnails as full-viewport
           slides with overlay info + index. Click selects the item. -->
      <div>
        {#each viewerItems as item, i (item.id)}
          {#if i < SSR_SLIDE_CAP || hydrated}
            <button
              onclick={() => selectItem(i)}
              class="group relative block h-dvh w-full overflow-hidden text-left"
              aria-pressed={i === selectedIndex}
            >
            {#if item.thumbnailUrl || item.mediaUrl}
              <AppImage
                src={item.thumbnailUrl ?? item.mediaUrl ?? ''}
                alt={item.title ?? ''}
                class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            {:else}
              <div class="absolute inset-0 flex items-center justify-center bg-pm-bg-sunken">
                <IconPhoto class="size-12 text-pm-text-muted" />
              </div>
            {/if}
            <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent"></div>
            <div class="relative z-10 flex h-full flex-col justify-end p-[var(--space-8)]">
              {#if item.category}
                <span class="text-xs font-semibold uppercase tracking-[0.12em] text-pm-brand-light">{item.category}</span>
              {/if}
              <h2 class="mt-2 text-4xl font-bold text-pm-white leading-tight">{item.title ?? item.caption ?? ''}</h2>
            </div>
            <span class="absolute bottom-[var(--space-8)] right-[var(--space-8)] z-10 text-sm text-pm-white/60 tracking-[0.05em]">
              {String(i + 1).padStart(2, '0')} / {String(viewerItems.length).padStart(2, '0')}
            </span>
            </button>
          {/if}
        {/each}
      </div>
    {:else}
      <!-- Item grid (all types): image cards, text-only for case_study. -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--gap-lg)]">
        {#each viewerItems as item, i (item.id)}
          {@const cardTitle = item.title ?? item.caption ?? ''}
          <button
            onclick={() => selectItem(i)}
            class="group relative overflow-hidden rounded-[var(--radius-xl)] border border-pm-border bg-pm-bg text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pm-focus-ring"
            aria-pressed={i === selectedIndex}
          >
            {#if isCaseStudy}
              <!-- Text-only card (case_study): no image, brand left border -->
              <div class="border-l-4 border-pm-brand p-6">
                {#if item.category}
                  <span class="text-xs font-semibold uppercase tracking-[var(--tracking-caps)] text-pm-brand">{item.category}</span>
                {/if}
                <h3 class="mt-2 text-lg font-bold text-pm-text">{cardTitle}</h3>
                {#if item.description}
                  <p class="mt-1 line-clamp-2 text-sm text-pm-text-secondary leading-relaxed">{item.description}</p>
                {/if}
              </div>
            {:else}
              <!-- Image-first card with hover-reveal info (info always
                   visible for website) -->
              <div class="relative aspect-4/3 overflow-hidden bg-pm-bg-sunken">
                {#if item.thumbnailUrl || item.mediaUrl}
                  <AppImage
                    src={item.thumbnailUrl ?? item.mediaUrl ?? ''}
                    alt={cardTitle}
                    class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                {:else}
                  <div class="flex h-full w-full items-center justify-center">
                    <IconPhoto class="size-10 text-pm-text-muted" />
                  </div>
                {/if}
                {#if !isInfoVisible}
                  <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100"></div>
                  <div class="absolute inset-x-0 bottom-0 translate-y-full p-4 transition-transform duration-200 group-hover:translate-y-0">
                    {#if item.category}
                      <span class="text-xs font-semibold uppercase tracking-[var(--tracking-caps)] text-pm-white">{item.category}</span>
                    {/if}
                    <h3 class="text-lg font-bold text-pm-white">{cardTitle}</h3>
                  </div>
                {/if}
              </div>
              <div class="p-5">
                <h3 class="text-lg font-bold text-pm-text group-hover:text-pm-brand transition-colors">{cardTitle}</h3>
                {#if item.description}
                  <p class="mt-1 line-clamp-2 text-sm text-pm-text-secondary">{item.description}</p>
                {/if}
              </div>
            {/if}
          </button>
        {/each}
      </div>
    {/if}

    <!-- Selected item detail: ONE item passed into the subtype viewer. -->
    {#if viewerOpen && selectedItem}
      <section
        id="portfolio-detail-panel"
        class="mt-12 rounded-[var(--radius-xl)] border border-pm-border bg-pm-bg p-[var(--space-6)] md:p-[var(--space-8)] scroll-mt-0"
      >
        <div class="mb-4 flex items-center justify-between gap-4 border-b border-pm-border pb-4">
          <p class="text-sm font-semibold uppercase tracking-[var(--tracking-caps)] text-pm-text-muted">{portfolio.name}</p>
          <button
            type="button"
            onclick={() => (viewerOpen = false)}
            class="inline-flex items-center gap-1 rounded-md p-2 text-pm-text-muted transition-colors hover:bg-pm-bg-sunken hover:text-pm-text"
            aria-label={t('common.close')}
          >
            <IconX class="size-5" />
          </button>
        </div>

        {#if portfolio.type === 'website'}
          <WebsiteViewer item={selectedItem} portfolioType="website" />
        {:else if portfolio.type === 'case_study'}
          <CaseStudyViewer item={selectedItem} portfolioType="case_study" />
        {:else if portfolio.type === 'brandbook'}
          <BrandbookViewer item={selectedItem} portfolioType="brandbook" />
        {:else if portfolio.type === 'branding'}
          <BrandingViewer item={selectedItem} portfolioType="branding" />
        {:else}
          <!-- Legacy gallery / unknown types: generic image/video/link detail -->
          <div class="space-y-4">
            {#if selectedItem.itemType === 'video' && selectedItem.mediaUrl}
              <video
                src={selectedItem.mediaUrl}
                controls
                class="w-full rounded-lg border border-pm-border bg-pm-bg-sunken"
              >
                <track kind="captions" />
              </video>
            {:else if selectedItem.itemType === 'link' && selectedItem.mediaUrl}
              <a
                href={selectedItem.mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="text-pm-brand hover:text-pm-brand-light"
              >
                {selectedItem.mediaUrl}
              </a>
            {:else if selectedItem.thumbnailUrl || selectedItem.mediaUrl}
              <AppImage
                src={selectedItem.thumbnailUrl ?? selectedItem.mediaUrl ?? ''}
                alt={selectedItem.title ?? selectedItem.caption ?? ''}
                class="w-full max-h-[70vh] rounded-lg border border-pm-border object-cover"
              />
            {/if}
            <div>
              {#if selectedItem.category}
                <span class="text-xs font-semibold uppercase tracking-[var(--tracking-caps)] text-pm-brand">{selectedItem.category}</span>
              {/if}
              <h3 class="mt-1 text-2xl font-bold text-pm-text">{selectedItem.title ?? selectedItem.caption ?? ''}</h3>
              {#if selectedItem.description}
                <p class="mt-2 text-base text-pm-text-secondary leading-relaxed">{selectedItem.description}</p>
              {/if}
            </div>
          </div>
        {/if}
      </section>
    {/if}
  {/if}
</PortfolioPageShell>
