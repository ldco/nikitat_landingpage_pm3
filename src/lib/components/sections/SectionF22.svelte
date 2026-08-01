<script lang="ts">
  import * as m from '$lib/i18n'
  import { t } from '$lib/stores/content.svelte'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'

  const title = $derived(t('f22.title', m.nav_f22()))
  const description = $derived(t('f22.description', ''))
  const ctaText = $derived(t('f22.cta', m.nav_contact()))
</script>

<section id="f22" class="section">
  <div class="section-body text-center" style="padding-inline: var(--px-container); max-width: var(--max-w-content); margin-inline: auto;">
    <h2 class="section-title text-center">{title}</h2>
    <div class="section-body">
      <p class="text-fluid-2xl text-pm-text-secondary leading-relaxed mb-8">
        {description || m.common_note()}
      </p>
      <CtaButton href="/#contact" variant="primary" size="lg">{ctaText}</CtaButton>
    </div>
  </div>
</section>
