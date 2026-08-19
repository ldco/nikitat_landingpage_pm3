<script lang="ts">
  /**
   * Legal Page — Renders markdown legal documents (DB-backed, XSS-safe render)
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
import { t } from '$lib/stores/content.svelte'
  import Seo from '$lib/components/atoms/Seo.svelte'
  import { renderLegalMarkdown } from '$lib/utils/legal-markdown'
  import { legalDocumentLabelKey } from '$lib/utils/legal-labels'
  import { FEATURES } from '$lib/config/site'
  import type { PageData } from './$types'
  let { data }: { data: PageData } = $props()
  const isContained = $derived(FEATURES.bodyWidthMode === 'contained')

  // Doc-specific title via the shared slug→label mapping (same source as the
  // footer legal links — translated labels can never drift between surfaces).
  const legalTitle = $derived(t(legalDocumentLabelKey(data.slug)))

  const rendered = $derived(renderLegalMarkdown(data.markdown ?? ''))
</script>

<Seo title={legalTitle} />

<article class={clsx('w-full mx-auto px-6 md:px-8 py-24 prose-headings:text-pm-text prose-p:text-pm-text-secondary prose-a:text-pm-brand', isContained && 'max-w-prose')}>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -- renderLegalMarkdown is escape-first XSS-safe (PM2 parity) -->
  {@html rendered}
</article>
