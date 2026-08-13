<script lang="ts">
  /**
   * SegmentedControl — segmented pill toggle for mutually exclusive options
   *
   * Renders one button per option; the active option is brand-filled with a
   * white count badge, inactive options are elevated cards with a muted count
   * badge (PM2 .section-toggle parity). Each option may carry an icon
   * (component reference) and an optional count badge. Extracted from the
   * admin translations Content/System toggle so route code has a single
   * approved segmented control to reuse.
   *
   * @props {Array<{id: string, label: string, icon?: Icon, count?: number}>} options — options to render (id, visible label, optional icon + count badge)
   * @props {string} active — currently selected option id
   * @props {(id: string) => void} onchange — selection callback
   * @props {string} [class] — extra classes merged via twMerge (e.g. layout margins)
   *
   * @example
   * <SegmentedControl
   *   options={[
   *     { id: 'content', label: t('admin.translationsContent'), icon: IconFileText, count: contentCount },
   *     { id: 'system', label: t('admin.translationsSystem'), icon: IconSettings, count: systemCount }
   *   ]}
   *   active={activeSection}
   *   onchange={(id) => (activeSection = id)}
   * />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import type { Icon } from '@tabler/icons-svelte'

  type SegmentedOption = {
    id: string
    label: string
    icon?: Icon
    count?: number
  }

  let {
    options,
    active,
    onchange,
    class: className = ''
  }: {
    options: SegmentedOption[]
    active: string
    onchange: (id: string) => void
    class?: string
  } = $props()

  const container = $derived(twMerge(clsx('flex gap-2', className)))
</script>

<div class={container}>
  {#each options as option}
    <button
      type="button"
      aria-pressed={option.id === active}
      class={clsx(
        'inline-flex items-center gap-2 px-4 py-2 rounded-md border text-sm transition-all',
        option.id === active
          ? 'bg-pm-brand border-pm-brand text-pm-white'
          : 'bg-pm-bg-elevated border-pm-border text-pm-text-muted hover:border-pm-brand hover:text-pm-text'
      )}
      onclick={() => onchange(option.id)}
    >
      {#if option.icon}
        {@const Icon = option.icon}
        <Icon class="size-4" />
      {/if}
      {option.label}
      {#if option.count !== undefined}
        <span
          class={clsx(
            'inline-flex items-center justify-center min-w-6 h-5 px-1.5 rounded-full text-xs',
            option.id === active ? 'bg-white/20' : 'bg-black/10'
          )}
        >
          {option.count}
        </span>
      {/if}
    </button>
  {/each}
</div>
