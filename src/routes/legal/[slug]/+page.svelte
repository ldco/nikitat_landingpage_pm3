<script lang="ts">
  /**
   * Legal Page — Renders markdown legal documents
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
import { t } from '$lib/stores/content.svelte'
  import Seo from '$lib/components/atoms/Seo.svelte'
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
</script>

<Seo title={legalTitle} />

<article class={clsx('w-full mx-auto px-6 md:px-8 py-24 prose-headings:text-pm-text prose-p:text-pm-text-secondary prose-a:text-pm-brand', isContained && 'max-w-prose')}>
  {data.markdown}
</article>
