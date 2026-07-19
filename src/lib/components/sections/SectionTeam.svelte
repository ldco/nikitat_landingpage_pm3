<script lang="ts">
  /**
   * SectionTeam — Team members (from API)
   * i18n: sections_team, nav_team
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'

  let {
    members = [] as Array<{ id: number; name: string; role: string; bio?: string; photoUrl?: string }>,
    class: className = ''
  }: {
    members?: Array<{ id: number; name: string; role: string; bio?: string; photoUrl?: string }>
    class?: string
  } = $props()
</script>

<section class={twMerge(clsx('py-20 md:py-28', className))}>
  <div class="container-wide">
    <h2 class="text-3xl sm:text-4xl font-bold text-pm-text font-display text-center">
      {m.nav_team()}
    </h2>
    <div class="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {#each members as member}
        <div class="text-center p-6 rounded-xl bg-pm-bg border border-pm-border">
          {#if member.photoUrl}
            <img src={member.photoUrl} alt={member.name} class="w-20 h-20 rounded-full mx-auto object-cover" />
          {:else}
            <div class="w-20 h-20 rounded-full mx-auto bg-pm-bg-sunken flex items-center justify-center text-pm-muted text-xl">
              {member.name.charAt(0)}
            </div>
          {/if}
          <h3 class="mt-4 font-bold text-pm-text">{member.name}</h3>
          <p class="text-sm text-pm-brand">{member.role}</p>
          {#if member.bio}
            <p class="mt-2 text-xs text-pm-text-muted">{member.bio}</p>
          {/if}
        </div>
      {:else}
        <div class="col-span-full">
          <p class="text-center text-pm-muted py-16">{m.common_note()}</p>
        </div>
      {/each}
    </div>
  </div>
</section>
