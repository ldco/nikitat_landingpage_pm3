<script lang="ts">
  /**
   * FooterCta — Config-driven CTA button for footer (PM v2 FooterCta.vue parity)
   *
   * - Text: from translations (cta_primaryButton)
   * - URL: from settings (footer.ctaUrl)
   * - ONLY shows if URL is set in database.
   *
   * Rule #1: class prop + twMerge
   *
   * @props {string} [class] — additional CSS classes merged via twMerge
   *
   * @example
   * <FooterCta />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { t } from '$lib/stores/content.svelte'
  import { useSettings } from '$lib/stores/settings.svelte'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'

  let {
    class: className = ''
  }: {
    class?: string
  } = $props()

  const settings = useSettings()

  const ctaUrl = $derived(settings.get('footer.ctaUrl'))
  const ctaText = t('cta.primaryButton')
  const hasValidCta = $derived(!!ctaUrl)
</script>

{#if hasValidCta}
  <div class={twMerge(clsx('footer-cta', className))}>
    <CtaButton href={ctaUrl ?? '#contact'} size="sm">
      {ctaText}
    </CtaButton>
  </div>
{/if}
