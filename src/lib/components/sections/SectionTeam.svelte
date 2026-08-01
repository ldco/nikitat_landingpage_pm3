<script lang="ts">
  /**
  * SectionTeam — Team member cards (PM3 rule 6)
 *
 * @example <SectionTeam />
  */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'
  import { FEATURES, MODULES } from '$lib/config/site'

  let {
    members = [] as Array<{ id: number; name: string; role: string; bio?: string; photoUrl?: string }>,
    class: className = ''
  }: {
    members?: Array<{ id: number; name: string; role: string; bio?: string; photoUrl?: string }>
    class?: string
  } = $props()

  const isContained = $derived(FEATURES.bodyWidthMode === 'contained')
  const teamModule = MODULES.team as { enabled?: boolean; config: { columnsDesktop?: number; columnsMobile?: number; showBio?: boolean } } | undefined
  const teamConfig = teamModule ? teamModule.config : { columnsDesktop: 4, columnsMobile: 1, showBio: true }
  const colsDesktopTeam = $derived(teamConfig.columnsDesktop ?? 4)
</script>

<section id="team" class={twMerge(clsx(
  'flex flex-col items-center bg-pm-bg-sunken',
  'pt-[var(--pt-section)] pb-16',
  className
))}>
  <div class={clsx('w-full mx-auto', isContained && 'max-w-container', 'px-container')}>
    <h2 class="text-fluid-3xl font-bold leading-tight mb-8 text-center">{m.sections_team()}</h2>
    <div class={clsx('grid grid-cols-1 gap-[var(--gap-lg)]',
      colsDesktopTeam >= 2 && 'sm:grid-cols-2',
      colsDesktopTeam >= 3 && 'lg:grid-cols-3',
      colsDesktopTeam >= 4 && 'xl:grid-cols-4',
    )}>
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
