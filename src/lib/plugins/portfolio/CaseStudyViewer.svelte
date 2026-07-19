<script lang="ts">
  /**
   * CaseStudyViewer — Rich portfolio case study with content + tags
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  let {
    title = '',
    content = '',
    tags = [] as string[],
    class: className = ''
  }: {
    title?: string
    content?: string
    tags?: string[]
    class?: string
  } = $props()
</script>

<article class={twMerge(clsx('space-y-6', className))}>
  <h2 class="text-2xl font-bold text-pm-text">{title}</h2>

  {#if content}
    <div class="text-base text-pm-text-secondary leading-relaxed space-y-4">{content}</div>
  {/if}

  {#if tags.length > 0}
    <div class="flex flex-wrap gap-2 pt-4 border-t border-pm-border">
      {#each tags as tag}
        <span class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-pm-bg-sunken text-pm-text-muted">{tag}</span>
      {/each}
    </div>
  {/if}
</article>
