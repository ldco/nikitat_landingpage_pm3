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
  import IconExternalLink from '@tabler/icons-svelte/icons/external-link'
  import AppImage from '$lib/components/atoms/AppImage.svelte'
  import Badge from '$lib/components/atoms/Badge.svelte'

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
        <IconExternalLink class="size-3.5" />
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
          <AppImage src={img.url} alt={img.caption ?? title} class="w-full object-cover" />
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
        <Badge variant="default">{tag}</Badge>
      {/each}
    </div>
  {/if}
</div>
