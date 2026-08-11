<script lang="ts">
  /**
   * AdminTabs — tab navigation for admin pages (locale switching, type filters)
   *
   * @props tabs — tab definitions ({ id, label, count?, warning? })
   * @props active — currently active tab id
   * @props indicator — optional function returning true when a tab shows the
   *        warning indicator dot (e.g. missing translations for that locale)
   * @props onchange — callback with the newly selected tab id
   * @example <AdminTabs tabs={localeTabs} active={activeLocale} onchange={(id) => activeLocale = id} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  export interface AdminTab {
    id: string
    label: string
    count?: number
  }

  let {
    tabs,
    active,
    indicator,
    class: className = '',
    onchange
  }: {
    tabs: AdminTab[]
    active: string
    indicator?: (id: string) => boolean
    class?: string
    onchange?: (id: string) => void
  } = $props()

  const merged = $derived(twMerge(clsx(
    'flex flex-wrap items-center gap-1 border-b border-pm-border',
    className
  )))
</script>

<div class={merged} role="tablist">
  {#each tabs as tab (tab.id)}
    <button
      type="button"
      role="tab"
      aria-selected={active === tab.id}
      class={clsx(
        'relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pm-focus-ring rounded-t-md -mb-px border-b-2',
        active === tab.id
          ? 'border-pm-brand text-pm-brand'
          : 'border-transparent text-pm-text-muted hover:text-pm-text hover:border-pm-border'
      )}
      onclick={() => onchange?.(tab.id)}
    >
      {tab.label}
      {#if tab.count !== undefined}
        <span class="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-pm-bg-sunken text-xs text-pm-text-muted">
          {tab.count}
        </span>
      {/if}
      {#if indicator?.(tab.id)}
        <span class="size-1.5 rounded-full bg-pm-warning" aria-hidden="true"></span>
      {/if}
    </button>
  {/each}
</div>
