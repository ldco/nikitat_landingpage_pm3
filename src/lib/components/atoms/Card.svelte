<script lang="ts">
  /**
   * Card — PM v2 card component (from ui/content/cards.css + content-card.css)
   *
   * Source: app-nuxt/app/assets/css/ui/content/cards.css (68 lines)
   *
   * Slot-based layout:
   *   <Card>
   *     <svelte:fragment slot="image">...</svelte:fragment>
   *     <svelte:fragment slot="header">...</svelte:fragment>
   *     Content (body)
   *     <svelte:fragment slot="footer">...</svelte:fragment>
   *     <svelte:fragment slot="actions">...</svelte:fragment>
   *   </Card>
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  let {
    hover = false,
    href,
    padding = 'default',
    class: className = '',
    onclick,
    children,
    header,
    footer,
    image,
    actions
  }: {
    hover?: boolean
    href?: string
    padding?: 'none' | 'sm' | 'default'
    class?: string
    onclick?: (e: MouseEvent) => void
    children?: import('svelte').Snippet
    header?: import('svelte').Snippet
    footer?: import('svelte').Snippet
    image?: import('svelte').Snippet
    actions?: import('svelte').Snippet
  } = $props()

  const base = $derived(
    'bg-pm-bg-elevated border border-pm-border rounded-xl overflow-hidden ' +
    (hover ? 'hover:shadow-lg hover:-translate-y-1 transition-all duration-200' : '')
  )

  const bodyPadding: Record<string, string> = {
    none: '',
    sm: 'px-4 py-4',
    default: 'px-6 py-6'
  }

  const merged = $derived(twMerge(clsx(base, className)))
</script>

{#if href}
  <a {href} class={merged} {onclick}>
    {#if image}{@render image()}{/if}
    {#if header}
      <div class="flex items-center justify-between gap-4 px-6 py-4 border-b border-pm-border">
        {@render header()}
      </div>
    {/if}
    <div class={bodyPadding[padding]}>
      {@render children?.()}
    </div>
    {#if actions}
      <div class="flex gap-2 px-3 py-2 border-t border-pm-border">
        {@render actions()}
      </div>
    {/if}
    {#if footer}
      <div class="px-6 py-4 border-t border-pm-border bg-pm-bg-sunken">
        {@render footer()}
      </div>
    {/if}
  </a>
{:else}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div class={merged} {onclick} role={onclick ? 'button' : undefined} tabindex={onclick ? 0 : undefined}>
    {#if image}{@render image()}{/if}
    {#if header}
      <div class="flex items-center justify-between gap-4 px-6 py-4 border-b border-pm-border">
        {@render header()}
      </div>
    {/if}
    <div class={bodyPadding[padding]}>
      {@render children?.()}
    </div>
    {#if actions}
      <div class="flex gap-2 px-3 py-2 border-t border-pm-border">
        {@render actions()}
      </div>
    {/if}
    {#if footer}
      <div class="px-6 py-4 border-t border-pm-border bg-pm-bg-sunken">
        {@render footer()}
      </div>
    {/if}
  </div>
{/if}
