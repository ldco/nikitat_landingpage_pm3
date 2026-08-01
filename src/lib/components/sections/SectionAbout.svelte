<script lang="ts">
  import IconPhoto from '@tabler/icons-svelte/icons/photo'
  import * as m from '$lib/i18n'
  import { t } from '$lib/stores/content.svelte'

  const title = $derived(t('about.title', m.sections_about()))
  const paragraph1 = $derived(t('about.paragraph1', ''))
  const paragraph2 = $derived(t('about.paragraph2', ''))
  const hasContent = $derived(paragraph1.length > 0)
</script>

<section id="about" class="section section-bg-elevated">
  <div class="section-body" style="padding-inline: var(--px-container);">
    <h2 class="section-title text-center">{title}</h2>

    <div class="about-grid">
      <!-- Visual (PM2: before/after slider placeholder → squircle with photo icon) -->
      <div class="about-visual">
        <IconPhoto class="size-12" />
      </div>

      <!-- Content -->
      <div class="section-body">
        {#if hasContent}
          <p class="about-content__lead text-fluid-xl">{paragraph1}</p>
          {#if paragraph2}
            <p class="about-content__body text-fluid-lg text-pm-text-secondary leading-relaxed">{paragraph2}</p>
          {/if}
        {:else}
          <p class="text-fluid-2xl text-pm-text-secondary leading-relaxed text-center">{m.common_note()}</p>
        {/if}
      </div>
    </div>
  </div>
</section>
