<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'

  let {
    class: className = ''
  }: {
    class?: string
  } = $props()
</script>

<section id="about" class={twMerge(clsx(
  'flex flex-col items-center',
  'pt-[calc(clamp(56px,8vh,72px)+3rem)] pb-16',
  className
))}>
  <div class="w-full mx-auto max-w-[1280px]" style="padding-inline: clamp(1rem, 3vw, 3rem);">
    <h2 class="text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight mb-8 text-center">
      {m.sections_about()}
    </h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-[var(--gap-xl)] items-center">
      <div class="aspect-4/3 bg-pm-bg-sunken rounded-xl overflow-hidden flex items-center justify-center text-pm-text-muted">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
      </div>
      <div>
        <p class="text-[clamp(1.4rem,3.2vw,1.875rem)] text-pm-text-secondary leading-relaxed">{m.common_note()}</p>
      </div>
    </div>
  </div>
</section>
