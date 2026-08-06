<script lang="ts">
  /**
   * MadeWith — "Made with Puppet Master" with horizontal logo (PM v2 parity)
   * Links to the Puppet Master website. Shows theme-appropriate logo.
   * Logo comes from /public/puppetmaster/ — framework-specific, not client assets.
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { t } from '$lib/stores/content.svelte'
  import { languageTag } from '$lib/paraglide/runtime.js'
  import { getTheme } from '$lib/stores/theme.svelte'

  interface Props {
    url?: string
    class?: string
  }

  let { url = 'https://puppetmaster.dev', class: className = '' }: Props = $props()

  const theme = $derived(getTheme())
  const base = 'inline-flex items-center gap-1.5 text-xs text-pm-text-muted'
  const langSuffix = $derived(languageTag() === 'ru' ? 'ru' : 'en')
  const basePath = '/puppetmaster'
</script>

{#if url}
  <div class={twMerge(clsx(base, className))}>
    <span>{t('footer.madeWith')}</span>
    <a href={url} target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-pm-brand hover:text-pm-brand-light transition-colors">
      <img
        src={`${basePath}/horizontal_dark_${langSuffix}.svg`}
        alt="Puppet Master"
        class="h-4 w-auto block dark:hidden"
      />
      <img
        src={`${basePath}/horizontal_light_${langSuffix}.svg`}
        alt="Puppet Master"
        class="h-4 w-auto hidden dark:block"
      />
    </a>
  </div>
{/if}
