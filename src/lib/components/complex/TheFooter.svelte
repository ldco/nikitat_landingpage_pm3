<script lang="ts">
  /**
   * TheFooter — Site footer
   * Nav links + MadeBy + MadeWith + copyright
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

  const base = 'border-t border-pm-gray-200 dark:border-pm-gray-700 bg-pm-bg dark:bg-pm-bg-dark-muted'
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
    <div class="mt-8 pt-6 border-t border-pm-gray-200 dark:border-pm-gray-700 text-center text-xs text-pm-muted dark:text-pm-muted-dark">
      &copy; {new Date().getFullYear()} Puppet Master. All rights reserved.
    </div>
  </div>
</footer>
