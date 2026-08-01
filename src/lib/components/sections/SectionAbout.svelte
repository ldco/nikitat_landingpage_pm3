<script lang="ts">
  import IconPhoto from '@tabler/icons-svelte/icons/photo'
  import * as m from '$lib/i18n'
  import { t } from '$lib/stores/content.svelte'

  const title = $derived(t('about.title', m.sections_about()))
  const paragraph1 = $derived(t('about.paragraph1', ''))
  const paragraph2 = $derived(t('about.paragraph2', ''))
  const hasContent = $derived(paragraph1.length > 0)
</script>

<section id="about" class="flex flex-col items-center pt-[var(--pt-section)] pb-[var(--space-16)] bg-pm-bg-elevated">
  <div style="padding-inline: var(--px-container);" class="w-full max-w-container mx-auto">
    <h2 class="text-[var(--section-heading)] font-black leading-tight text-center mb-[var(--space-8)]">{title}</h2>

    <div class="flex flex-col items-center gap-[var(--gap-xl)]">
      <div class="about-visual">
        <IconPhoto class="size-12" />
      </div>

      <div class="w-full">
        {#if hasContent}
          <!-- Brand accent bar (PM2 ::before pseudo-element → real div) -->
          <div class="w-12 h-[3px] bg-pm-brand rounded-full mb-[var(--space-4)]"></div>
          <p class="mb-[var(--space-5)] text-[var(--section-body-size)] text-pm-text leading-relaxed">
            {paragraph1}
          </p>
          {#if paragraph2}
            <p class="text-fluid-lg text-pm-text-secondary leading-relaxed">{paragraph2}</p>
          {/if}
        {:else}
          <p class="text-fluid-2xl text-pm-text-secondary leading-relaxed text-center">{m.common_note()}</p>
        {/if}
      </div>
    </div>
  </div>
</section>
