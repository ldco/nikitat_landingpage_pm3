<script lang="ts">
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

<section id="team" class={twMerge(clsx('section section-bg-sunken', className))}>
  <div class="w-full mx-auto" style="max-width: var(--content-default, 80rem); padding-inline: clamp(1rem, 3vw, 3rem);">
    <h2 class="section-title">{m.sections_team()}</h2>

    <div class="team-grid">
      {#each members as member}
        <div class="team-card">
          {#if member.photoUrl}
            <img src={member.photoUrl} alt={member.name} class="team-photo" />
          {:else}
            <div class="team-photo-placeholder">{member.name.charAt(0)}</div>
          {/if}
          <h3 class="team-name">{member.name}</h3>
          <p class="team-role">{member.role}</p>
          {#if member.bio}
            <p class="team-bio">{member.bio}</p>
          {/if}
        </div>
      {:else}
        <p class="text-center text-pm-muted col-span-full py-16">{m.common_note()}</p>
      {/each}
    </div>
  </div>
</section>

<style>
  .section {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-block-start: calc(var(--header-height, 72px) + var(--space-12));
    padding-block-end: var(--space-16);
    scroll-margin-top: 0;
  }
  .section-bg-sunken { background: var(--color-pm-bg-sunken); }
  .section-title {
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: var(--font-weight-bold);
    line-height: var(--leading-tight);
    margin-block-end: var(--space-8);
    text-align: center;
  }
  .team-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--gap-lg);
  }
  .team-card {
    text-align: center;
    padding: var(--space-6);
    border-radius: var(--radius-xl);
    background: var(--color-pm-bg-elevated);
    border: 1px solid var(--color-pm-border);
  }
  .team-photo {
    width: 5rem;
    height: 5rem;
    border-radius: 9999px;
    margin: 0 auto;
    object-fit: cover;
  }
  .team-photo-placeholder {
    width: 5rem;
    height: 5rem;
    border-radius: 9999px;
    margin: 0 auto;
    background: var(--color-pm-bg-sunken);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-pm-text-muted);
    font-size: var(--text-xl);
  }
  .team-name {
    margin-block-start: var(--space-4);
    font-weight: var(--font-weight-bold);
    color: var(--color-pm-text);
  }
  .team-role {
    font-size: var(--text-sm);
    color: var(--color-pm-brand);
    margin-block-start: var(--space-1);
  }
  .team-bio {
    margin-block-start: var(--space-2);
    font-size: var(--text-xs);
    color: var(--color-pm-text-muted);
  }
  @media (min-width: 640px) { .team-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 1024px) { .team-grid { grid-template-columns: repeat(4, 1fr); } }
</style>
