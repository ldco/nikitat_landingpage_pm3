<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'

  let {
    areas = [] as Array<{ title: string; desc: string }>,
    class: className = ''
  }: {
    areas?: Array<{ title: string; desc: string }>
    class?: string
  } = $props()
</script>

<section id="focus" class={twMerge(clsx(
  'flex flex-col items-center bg-pm-bg-elevated',
  'pt-[calc(clamp(56px,8vh,72px)+3rem)] pb-16',
  className
))}>
  <div class="w-full mx-auto max-w-[1280px]" style="padding-inline: clamp(1rem, 3vw, 3rem);">
    <h2 class="text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight mb-8 text-center">{m.sections_services()}</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--gap-lg)]">
      {#each areas as area}
        <div class="bg-pm-bg border border-pm-border rounded-xl p-6 transition-transform hover:-translate-y-0.5 hover:shadow-md">
          <h3 class="text-xl font-semibold mb-3 text-pm-text">{area.title}</h3>
          <p class="text-base text-pm-text-secondary leading-relaxed">{area.desc}</p>
        </div>
      {:else}
        <p class="text-center text-pm-muted col-span-full py-12">{m.common_note()}</p>
      {/each}
    </div>
  </div>
</section>
