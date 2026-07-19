<script lang="ts">
  /**
   * MadeWith — Framework credit link (PM v2 tokens)
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

<div class={twMerge(clsx(base, className))}>
  <span>Made with</span>
  <a href="https://puppetmaster.dev" target="_blank" rel="noopener noreferrer" class="text-pm-brand hover:text-pm-brand-light transition-colors">
    Puppet Master
  </a>
</div>
