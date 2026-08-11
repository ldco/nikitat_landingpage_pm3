<script lang="ts">
  /**
   * ContactPicker — multi-select toggle button grid
   *
   * Used in admin settings to configure which contact fields appear
   * in the header quick-contact bar and on the contact page.
   *
   * @props {ContactOption[]} options — available toggle options with key, label, icon
   * @props {string[]} selected — selected option keys (two-way bindable)
   * @props {string} [class] — additional classes
   *
   * @example
   * <ContactPicker {options} bind:selected={headerQuickItems} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import type { ComponentType } from 'svelte'

  interface ContactOption {
    key: string
    label: string
    icon?: ComponentType
  }

  let {
    options,
    selected = $bindable([]),
    class: className = ''
  }: {
    options: ContactOption[]
    selected?: string[]
    class?: string
  } = $props()

  function toggle(key: string): void {
    if (selected.includes(key)) {
      selected = selected.filter(k => k !== key)
    } else {
      selected = [...selected, key]
    }
  }
</script>

<div class={twMerge(clsx('flex flex-wrap gap-3', className))}>
  {#each options as opt (opt.key)}
    <button type="button"
      onclick={() => toggle(opt.key)}
      aria-pressed={selected.includes(opt.key)}
      class={clsx(
        'inline-flex items-center gap-2 min-h-11 px-3 py-2 rounded-full border text-sm transition-all cursor-pointer',
        selected.includes(opt.key)
          ? 'border-pm-brand bg-pm-brand text-white'
          : 'border-pm-border bg-pm-bg text-pm-text-muted hover:border-pm-brand hover:text-pm-text'
      )}>
      {#if opt.icon}
        <opt.icon class="size-5 shrink-0" />
      {/if}
      <span class="text-sm font-medium">{opt.label}</span>
    </button>
  {/each}
</div>
