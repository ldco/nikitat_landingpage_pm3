<script lang="ts">
  /**
   * BrandingViewer — Portfolio branding/gallery content viewer (PM v2)
   *
   * Source: app-nuxt/app/assets/css/ui/content/portfolio-branding.css
   * Uses: AppImage for all image rendering.
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import IconExternalLink from '@tabler/icons-svelte/icons/external-link'
  import AppImage from '$lib/components/atoms/AppImage.svelte'
  import Badge from '$lib/components/atoms/Badge.svelte'
  import { t } from '$lib/stores/content.svelte'

  let {
    title = '',
    description = '',
    clientUrl = '',
    tags = [] as string[],
    sections = [] as Array<{ title: string; text?: string }>,
    images = [] as Array<{ url: string; caption?: string }>,
    class: className = ''
  }: {
    title?: string
    description?: string
    clientUrl?: string
    tags?: string[]
    sections?: Array<{ title: string; text?: string }>
    images?: Array<{ url: string; caption?: string }>
    class?: string
  } = $props()
</script>

<div class={twMerge(clsx('space-y-6', className))}>
  <div class="mb-6">
    <h2 class="text-2xl font-bold text-pm-text">{title}</h2>
    {#if description}
      <p class="mt-2 text-base text-pm-text-secondary leading-relaxed">{description}</p>
    {/if}
    {#if clientUrl}
      <a href={clientUrl} target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 mt-3 text-sm text-pm-brand hover:text-pm-brand-light transition-colors">
        <IconExternalLink class="size-3.5" />
        {t('portfolio.clientUrl')}
      </a>
    {/if}
  </div>

  {#if sections.length > 0}
    <div class="space-y-5">
      {#each sections as section}
        <div>
          <h3 class="text-lg font-semibold text-pm-text">{section.title}</h3>
          {#if section.text}
            <p class="mt-1 text-base text-pm-text-secondary leading-relaxed">{section.text}</p>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {#each images as img}
      <div class="aspect-4/3 rounded-lg overflow-hidden bg-pm-bg-sunken">
        <AppImage src={img.url} alt={img.caption ?? title} class="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
        {#if img.caption}
          <p class="p-2 text-xs text-pm-text-muted">{img.caption}</p>
        {/if}
      </div>
    {/each}
  </div>

  {#if tags.length > 0}
    <div class="flex flex-wrap gap-2 pt-2">
      {#each tags as tag}
        <Badge variant="default">{tag}</Badge>
      {/each}
    </div>
  {/if}
</div>
