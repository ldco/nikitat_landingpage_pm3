<script lang="ts">
  /**
   * MadeWith — Framework credit link (i18n-powered)
   * All values passed via props — no hardcoded defaults.
   * If no url provided, renders nothing.
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'

  let {
    url = '',
    class: className = ''
  }: {
    url?: string
    class?: string
  } = $props()

  const base = 'inline-flex items-center gap-1 text-xs text-pm-text-muted'
</script>

{#if url}
  <div class={twMerge(clsx(base, className))}>
    <span>{m.footer_madeWith()}</span>
    <a href={url} target="_blank" rel="noopener noreferrer" class="text-pm-brand hover:text-pm-brand-light transition-colors">
      {m.footer_puppetMaster()}
    </a>
  </div>
{/if}
