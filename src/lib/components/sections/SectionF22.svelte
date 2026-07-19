<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'

  let {
    title = m.nav_f22(),
    description = '',
    class: className = ''
  }: {
    title?: string
    description?: string
    class?: string
  } = $props()
</script>

<section id="f22" class={twMerge(clsx(
  'flex flex-col items-center bg-pm-bg-sunken',
  'pt-[calc(clamp(56px,8vh,72px)+3rem)] pb-16',
  className
))}>
  <div class="w-full mx-auto max-w-[1280px]" style="padding-inline: clamp(1rem, 3vw, 3rem);">
    <h2 class="text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight mb-8 text-center">{title}</h2>
    <div class="flex flex-col items-center text-center max-w-2xl mx-auto">
      <p class="text-[clamp(1.4rem,3.2vw,1.875rem)] text-pm-text-secondary leading-relaxed mb-8">{description || m.common_note()}</p>
      <CtaButton href="/#contact" variant="primary" size="lg">{m.nav_contact()}</CtaButton>
    </div>
  </div>
</section>
