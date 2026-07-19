<script lang="ts">
  /**
   * WebsiteViewer — Portfolio website screenshots + live URL
   *
   * Source: app-nuxt/app/assets/css/ui/content/website-viewer.css (67 lines)
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  let {
    title = '',
    url = '',
    description = '',
    screenshots = [] as Array<{ url: string; caption?: string }>,
    tags = [] as string[],
    class: className = ''
  }: {
    title?: string
    url?: string
    description?: string
    screenshots?: Array<{ url: string; caption?: string }>
    tags?: string[]
    class?: string
  } = $props()
</script>

<div class={twMerge(clsx('space-y-6', className))}>
  <div class="mb-6">
    <h2 class="text-2xl font-bold text-pm-text">{title}</h2>
    {#if url}
      <a href={url} target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 mt-2 text-sm text-pm-brand hover:text-pm-brand-light transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
        {url.replace(/^https?:\/\//, '')}
      </a>
    {/if}
  </div>

  {#if description}
    <p class="text-base text-pm-text-secondary leading-relaxed">{description}</p>
  {/if}

  {#if screenshots.length > 0}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {#each screenshots as img}
        <div class="rounded-lg overflow-hidden border border-pm-border">
          <img src={img.url} alt={img.caption ?? title} class="w-full object-cover" />
          {#if img.caption}
            <p class="p-2 text-xs text-pm-text-muted">{img.caption}</p>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  {#if tags.length > 0}
    <div class="flex flex-wrap gap-2">
      {#each tags as tag}
        <span class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-pm-bg-sunken text-pm-text-muted">{tag}</span>
      {/each}
    </div>
  {/if}
</div>
