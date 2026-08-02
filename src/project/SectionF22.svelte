<script lang="ts">
  /**
  * SectionF22 — Fabrica22 partnership section: description + CTA (PM3 rule 6)
 *
 * Content from content store: f22.title, f22.description, f22.cta
 *
 * @example <SectionF22 />
  */
  import * as m from '$lib/i18n'
  import { t } from '$lib/stores/content.svelte'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'

  const title = $derived(t('f22.title', m.nav_f22()))
  const description = $derived(t('f22.description', ''))
  const ctaText = $derived(t('f22.cta', m.nav_contact()))
</script>

<section id="f22" class="flex flex-col items-center pt-[var(--pt-section)] pb-[var(--space-16)]">
  <div class="px-container max-w-content mx-auto flex flex-col items-center text-center w-full">
    <h2 class="text-[var(--section-heading)] font-black leading-tight text-center mb-[var(--space-8)]">{title}</h2>
    <div class="flex flex-col items-center">
      <p class="text-fluid-2xl text-pm-text-secondary leading-relaxed mb-[var(--space-8)]">
        {description || m.common_note()}
      </p>
      <CtaButton href="/#contact" variant="primary" size="lg">{ctaText}</CtaButton>
    </div>
  </div>
</section>
