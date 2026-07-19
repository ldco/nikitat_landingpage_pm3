<script lang="ts">
  /**
   * TheFooter — Site footer (PM v2 design)
   * Nav links + MadeBy + MadeWith + copyright
   *
   * Source: app-nuxt/app/assets/css/skeleton/footer.css
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import NavLinks from '$lib/components/molecules/NavLinks.svelte'
  import MadeBy from '$lib/components/atoms/MadeBy.svelte'
  import MadeWith from '$lib/components/atoms/MadeWith.svelte'

  let {
    class: className = ''
  }: {
    class?: string
  } = $props()

  const base = 'border-t border-pm-border/50 bg-pm-bg'
</script>

<footer class={twMerge(clsx(base, className))}>
  <div class="container-wide py-12">
    <div class="flex flex-col md:flex-row items-center justify-between gap-8">
      <NavLinks />
      <div class="flex flex-col items-center md:items-end gap-2">
        <MadeBy />
        <MadeWith />
      </div>
    </div>
    <div class="mt-8 pt-6 border-t border-pm-border/50 text-center text-xs text-pm-text-muted">
      &copy; {new Date().getFullYear()} Puppet Master. All rights reserved.
    </div>
  </div>
</footer>
