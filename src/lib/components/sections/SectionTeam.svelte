<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'
  import { FEATURES } from '$lib/config/site'

  let {
    members = [] as Array<{ id: number; name: string; role: string; bio?: string; photoUrl?: string }>,
    class: className = ''
  }: {
    members?: Array<{ id: number; name: string; role: string; bio?: string; photoUrl?: string }>
    class?: string
  } = $props()

  const isContained = $derived(FEATURES.bodyWidthMode === 'contained')
</script>

<section id="team" class={twMerge(clsx(
  'flex flex-col items-center bg-pm-bg-sunken',
  'pt-[calc(clamp(56px,8vh,72px)+3rem)] pb-16',
  className
))}>
  <div class={clsx('w-full mx-auto', isContained && 'max-w-[1280px]')} style="padding-inline: clamp(1rem, 3vw, 3rem);">
    <h2 class="text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight mb-8 text-center">{m.sections_team()}</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[var(--gap-lg)]">
      {#each members as member}
        <div class="text-center p-6 rounded-xl bg-pm-bg-elevated border border-pm-border">
          {#if member.photoUrl}
            <img src={member.photoUrl} alt={member.name} class="w-20 h-20 rounded-full mx-auto object-cover" />
          {:else}
            <div class="w-20 h-20 rounded-full mx-auto bg-pm-bg-sunken flex items-center justify-center text-pm-text-muted text-xl">{member.name.charAt(0)}</div>
          {/if}
          <h3 class="mt-4 font-bold text-pm-text">{member.name}</h3>
          <p class="text-sm text-pm-brand mt-1">{member.role}</p>
          {#if member.bio}
            <p class="mt-2 text-xs text-pm-text-muted">{member.bio}</p>
          {/if}
        </div>
      {:else}
        <p class="text-center text-pm-muted col-span-full py-16">{m.common_note()}</p>
      {/each}
    </div>
  </div>
</section>
