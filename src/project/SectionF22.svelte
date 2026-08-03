<script lang="ts">
  /**
  * SectionF22 — Fabrica22 partnership section: description + CTAs + logos
  *
  * Content from content store: f22.title, f22.description, f22.cta
  * Logos from FOOTER_MADE_BY project config.
  */
  import * as m from '$lib/i18n'
  import { reveal } from '$lib/actions/reveal'
  import { t } from '$lib/stores/content.svelte'
  import { FOOTER_MADE_BY } from '$lib/config/site'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'

  const title = $derived(t('f22.title', m.nav_f22()))
  const description = $derived(t('f22.description', ''))
  const ctaText = $derived(t('f22.cta', m.nav_contact()))
  const logoBase = $derived(FOOTER_MADE_BY.basePath)
</script>

<section use:reveal id="f22" class="flex flex-col items-center pt-[var(--pt-section)] pb-[var(--space-16)]">
  <div class="px-container max-w-content mx-auto flex flex-col items-center text-center w-full">
    <h2 class="text-[var(--section-heading)] font-black leading-tight text-center mb-[var(--space-8)]">{title}</h2>
    <div class="flex flex-col items-center">
      <p class="text-fluid-2xl text-pm-text-secondary leading-relaxed mb-[var(--space-8)]">
        {description || m.common_note()}
      </p>

      <!-- Fabrica22 logos (PM2: footerMadeBy branding logos) -->
      <div class="flex flex-wrap items-center justify-center gap-[var(--space-6)] mb-[var(--space-8)]">
        <div class="bg-pm-bg rounded-xl border border-pm-border p-[var(--space-4)]">
          <picture>
            <source srcset="{logoBase}/horizontal_light_en.svg" media="(prefers-color-scheme: dark)" />
            <img src="{logoBase}/horizontal_dark_en.svg" alt="Fabrica 22" class="h-[var(--logo-desktop-height)] w-auto" />
          </picture>
        </div>
        <div class="bg-pm-bg rounded-xl border border-pm-border p-[var(--space-4)]">
          <picture>
            <source srcset="{logoBase}/circle_light_en.svg" media="(prefers-color-scheme: dark)" />
            <img src="{logoBase}/circle_dark_en.svg" alt="Fabrica 22" class="h-[var(--logo-desktop-height)] w-auto" />
          </picture>
        </div>
      </div>

      <CtaButton href="/#contact" variant="primary" size="lg">{ctaText}</CtaButton>
    </div>
  </div>
</section>
