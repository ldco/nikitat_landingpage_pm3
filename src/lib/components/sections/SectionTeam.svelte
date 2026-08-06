<script lang="ts">
  /**
  * SectionTeam — Team member cards (PM3 rule 6)
 *
 * @example <SectionTeam />
  */
  import { clsx } from 'clsx'
  import { t } from '$lib/stores/content.svelte'
  import { FEATURES, MODULES } from '$lib/config/site'
  import Section from '$lib/components/atoms/Section.svelte'
  import SectionContent from '$lib/components/molecules/SectionContent.svelte'

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

<Section id="team" background="sunken" class={className}>
  <SectionContent width={isContained ? 'default' : 'full'}>
    <h2 class="text-fluid-3xl font-bold leading-tight mb-8 text-center">{t('sections.team')}</h2>
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
        <p class="text-center text-pm-muted col-span-full py-16">{t('common.note')}</p>
      {/each}
    </div>
  </SectionContent>
</Section>
