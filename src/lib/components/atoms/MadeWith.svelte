<script lang="ts">
  /**
   * MadeWith — Framework credit link (disabled by default — no hardcoded text)
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  let {
    class: className = ''
  }: {
    class?: string
  } = $props()

  const base = 'inline-flex items-center gap-1 text-xs text-pm-text-muted'
</script>

<!-- Framework credit — enable by adding { enabled: true, url, label } to site config -->
<div class={twMerge(clsx(base, className))}>
  {#if false}
    <!-- Placeholder: no hardcoded text -->
  {/if}
</div>
