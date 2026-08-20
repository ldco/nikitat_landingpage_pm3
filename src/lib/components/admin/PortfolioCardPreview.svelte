<script lang="ts">
  /**
   * PortfolioCardPreview — live portfolio card preview for the admin editor
   *
   * Renders the EXACT same image area the public PortfolioCard uses (shared
   * PortfolioCardImage atom) and two-way-binds `coverImageUrl`, so the admin
   * sees in real time what visitors will see on the listing/section:
   *   1. the uploaded cover image (takes priority),
   *   2. otherwise the six-image collage of the first six item thumbnails,
   *   3. otherwise the placeholder.
   * The `thumbnails` prop supplies the item-collage fallback (loaded by the
   * edit route); the hint text explains the fallback rule in plain language.
   *
   * Rule #1: class prop + twMerge
   *
   * @props {string} coverImageUrl — live cover URL (two-way bindable)
   * @props {string[]} [thumbnails=[]] — first six item thumbnails for the collage fallback
   * @props {string} [title=''] — preview heading (i18n-resolved)
   * @props {string} [hint=''] — explanatory copy (i18n-resolved)
   * @props {string} [class] — additional CSS classes merged via twMerge
   *
   * @example
   * <PortfolioCardPreview bind:coverImageUrl={coverImageUrl} thumbnails={data.thumbnails} title={t('admin.cardPreview')} hint={t('admin.coverImageHint')} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import PortfolioCardImage from '$lib/components/atoms/PortfolioCardImage.svelte'

  let {
    coverImageUrl = $bindable(''),
    thumbnails = [] as string[],
    title = '',
    hint = '',
    class: className = ''
  }: {
    coverImageUrl?: string
    thumbnails?: string[]
    title?: string
    hint?: string
    class?: string
  } = $props()
</script>

<div class={twMerge(clsx('flex flex-col gap-1.5', className))}>
  {#if title}
    <span class="text-sm font-medium text-pm-text">{title}</span>
  {/if}
  <div class="max-w-sm overflow-hidden rounded-[var(--radius-lg)] border border-pm-border bg-pm-bg">
    <PortfolioCardImage {coverImageUrl} {thumbnails} alt="" />
  </div>
  {#if hint}
    <!-- text-pm-text-secondary (not muted): hint text on the white form
         background needs 4.5:1 — muted is only ~3:1 (axe color-contrast
         violation) -->
    <p class="text-xs leading-relaxed text-pm-text-secondary">{hint}</p>
  {/if}
</div>
