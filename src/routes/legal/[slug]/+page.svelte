<script lang="ts">
  /**
   * Legal Page — Renders markdown legal documents (DB-backed, XSS-safe render)
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
import { t } from '$lib/stores/content.svelte'
  import Seo from '$lib/components/atoms/Seo.svelte'
  import { renderLegalMarkdown } from '$lib/utils/legal-markdown'
  import { FEATURES } from '$lib/config/site'
  import type { PageData } from './$types'
  let { data }: { data: PageData } = $props()
  const isContained = $derived(FEATURES.bodyWidthMode === 'contained')

  // Doc-specific title via the shared metadata contract (translated labels).
  const legalTitle = $derived(
    data.slug === 'privacy-policy'
      ? t('footer.privacy')
      : data.slug === 'personal-data-policy'
        ? t('footer.personalData')
        : t('legal.title')
  )

  const rendered = $derived(renderLegalMarkdown(data.markdown ?? ''))
</script>

<Seo title={legalTitle} />

<article class={clsx('w-full mx-auto px-6 md:px-8 py-24 prose-headings:text-pm-text prose-p:text-pm-text-secondary prose-a:text-pm-brand', isContained && 'max-w-prose')}>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -- renderLegalMarkdown is escape-first XSS-safe (PM2 parity) -->
  {@html rendered}
</article>
