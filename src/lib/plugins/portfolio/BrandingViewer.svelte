<script lang="ts">
  /**
   * BrandingViewer — Portfolio branding/gallery content viewer
   *
   * Source: app-nuxt/app/assets/css/ui/content/portfolio-branding.css
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  let {
    title = '',
    description = '',
    images = [] as Array<{ url: string; caption?: string }>,
    class: className = ''
  }: {
    title?: string
    description?: string
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
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {#each images as img}
      <div class="aspect-[4/3] rounded-lg overflow-hidden bg-pm-bg-sunken">
        <img src={img.url} alt={img.caption ?? title} class="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
        {#if img.caption}
          <p class="p-2 text-xs text-pm-text-muted">{img.caption}</p>
        {/if}
      </div>
    {/each}
  </div>
</div>
