<script lang="ts">
  /**
   * SectionAbout — About section
   * i18n: sections_about
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'

  let {
    content = '',
    class: className = ''
  }: {
    content?: string
    class?: string
  } = $props()
</script>

<section class={twMerge(clsx('py-20 md:py-28', className))}>
  <div class="container-narrow">
    <h2 class="text-3xl sm:text-4xl font-bold text-pm-gray-900 dark:text-pm-white font-display text-center">
      {m.sections_about()}
    </h2>
    {#if content}
      <div class="mt-8 text-lg text-pm-gray-600 dark:text-pm-gray-400 leading-relaxed">
        {content}
      </div>
    {:else}
      <p class="mt-8 text-center text-pm-muted">{m.common_note()}</p>
    {/if}
  </div>
</section>
