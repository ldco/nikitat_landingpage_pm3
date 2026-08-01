<script lang="ts">
  /**
   * CaseStudyViewer — Rich portfolio case study (PM v2 CaseStudyViewer.vue parity)
   *
   * Parses content lines: lines starting with "### " become headings,
   * everything else becomes paragraphs. Renders tags as badges.
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import Badge from '$lib/components/atoms/Badge.svelte'

  interface ContentBlock {
    id: number
    type: 'heading' | 'text'
    text: string
  }

  let {
    title = '',
    content = '',
    description = '',
    tags = [] as string[],
    class: className = ''
  }: {
    title?: string
    content?: string
    description?: string
    tags?: string[]
    class?: string
  } = $props()

  /** Parse content into heading/text blocks (PM v2 parseContent parity) */
  function parseContent(raw: string): ContentBlock[] {
    const blocks: ContentBlock[] = []
    let id = 0
    for (const rawLine of raw.split('\n')) {
      const trimmed = rawLine.trim()
      if (!trimmed) continue
      const headingMatch = trimmed.match(/^###\s+(.+)/)
      if (headingMatch?.[1]) {
        blocks.push({ id: id++, type: 'heading', text: headingMatch[1] })
      } else {
        blocks.push({ id: id++, type: 'text', text: trimmed })
      }
    }
    return blocks
  }

  const blocks = $derived(parseContent(content))
</script>

<article class={twMerge(clsx('space-y-6', className))}>
  <div class="space-y-2">
    <h2 class="text-2xl font-bold text-pm-text">{title}</h2>
  </div>

  {#if blocks.length > 0}
    <div class="space-y-4">
      {#each blocks as block (block.id)}
        {#if block.type === 'heading'}
          <h3 class="text-lg font-semibold text-pm-text pt-2">{block.text}</h3>
        {:else}
          <p class="text-base text-pm-text-secondary leading-relaxed">{block.text}</p>
        {/if}
      {/each}
    </div>
  {:else if description}
    <p class="text-base text-pm-text-secondary leading-relaxed">{description}</p>
  {/if}

  {#if tags.length > 0}
    <div class="flex flex-wrap gap-2 pt-4 border-t border-pm-border">
      {#each tags as tag}
        <Badge variant="default">{tag}</Badge>
      {/each}
    </div>
  {/if}
</article>
