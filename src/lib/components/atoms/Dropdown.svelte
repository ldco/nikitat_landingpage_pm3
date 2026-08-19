<script lang="ts">
  /**
   * Dropdown — framework-level custom select (replaces every native <select>)
   *
   * A themed listbox control (trigger button + portaled options list) with
   * full keyboard navigation, ARIA listbox semantics, click-outside handling
   * and per-design-token styling. i18n label resolution is BAKED IN: option
   * `label` fields are resolved through the unified `t()` helper, so callers
   * pass i18n KEYS (e.g. `'admin.portfolioTypeBranding'`) or literals — the
   * component never renders a raw key when a translation exists, and the
   * resolved text follows locale switches without a reload. Form submission
   * flows through a hidden input carrying `name` + `value` (no native
   * <select> is kept or hidden).
   *
   * @props {string} name — control name (hidden-input name, id for label association)
   * @props {string} [value=''] — selected option value (two-way via bind:value)
   * @props {Array<{value: string, label: string}>} [options=[]] — options; label is an i18n key or a literal
   * @props {string} [placeholder=''] — text shown when no option is selected
   * @props {boolean} [required=false] — required marker (aria + FormField label marker)
   * @props {boolean} [disabled=false] — disabled state
   * @props {boolean} [invalid=false] — error styling (border/ring in danger tokens)
   * @props {string} [ariaLabel=''] — aria-label for label-less controls
   * @props {string} [inputClass=''] — extra classes merged onto the trigger (public-form styling)
   * @props {string} [class] — extra classes merged via twMerge onto the wrapper
   * @props {(e: Event) => void} [oninput] — change callback (fired after selection)
   *
   * @example
   * <Dropdown name="type" options={[{ value: 'branding', label: 'admin.portfolioTypeBranding' }]} bind:value={type} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { t } from '$lib/stores/content.svelte'
  import IconChevronDown from '@tabler/icons-svelte/icons/chevron-down'
  import IconCheck from '@tabler/icons-svelte/icons/check'

  export interface DropdownOption {
    value: string
    label: string
  }

  let {
    name,
    value = $bindable(''),
    options = [] as DropdownOption[],
    // `value` is `string | boolean` for symmetry with FormField's control
    // contract; a boolean simply never matches an option (no-op).

    placeholder = '',
    required = false,
    disabled = false,
    invalid = false,
    ariaLabel = '',
    inputClass = '',
    class: className = '',
    oninput
  }: {
    name: string
    value?: string | boolean
    options?: DropdownOption[]
    placeholder?: string
    required?: boolean
    disabled?: boolean
    invalid?: boolean
    ariaLabel?: string
    inputClass?: string
    class?: string
    oninput?: (e: Event) => void
  } = $props()

  let open = $state(false)
  let triggerEl = $state<HTMLElement>()
  let listEl = $state<HTMLElement>()
  let activeIndex = $state(-1)
  let typeahead = $state('')
  let typeaheadTimer: ReturnType<typeof setTimeout> | undefined

  const instanceId = Math.random().toString(36).slice(2, 10)
  const listId = `pm-dropdown-list-${instanceId}`
  const optionId = (index: number): string => `pm-dropdown-option-${instanceId}-${index}`

  const selectedIndex = $derived(options.findIndex(o => o.value === value))
  const selectedOption = $derived(selectedIndex >= 0 ? options[selectedIndex] : undefined)
  const selectedLabel = $derived(
    selectedOption?.label !== undefined ? resolveLabel(selectedOption.label) : placeholder
  )
  const controlClass = $derived(twMerge(clsx(
    'w-full flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm transition-colors focus:outline-none',
    invalid
      ? 'border-pm-danger bg-pm-bg text-pm-text focus:border-pm-danger focus:ring-2 focus:ring-pm-danger'
      : 'border-pm-border bg-pm-bg text-pm-text focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring',
    placeholder && selectedIndex < 0 ? 'text-pm-text-muted' : '',
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
    inputClass
  )))

  /** Resolve an option label: i18n key when a translation exists, literal otherwise. */
  function resolveLabel(label: string): string {
    return t(label, label)
  }

  function positionList(): void {
    if (!triggerEl || !listEl) return
    const rect = triggerEl.getBoundingClientRect()
    const listHeight = listEl.offsetHeight
    const gap = 4
    let top = rect.bottom + gap
    if (top + listHeight > window.innerHeight - gap) {
      top = Math.max(gap, rect.top - gap - listHeight)
    }
    listEl.style.top = `${top}px`
    listEl.style.left = `${rect.left}px`
    listEl.style.width = `${rect.width}px`
  }

  function onReposition(): void {
    if (open) positionList()
  }

  function onOutsidePointer(e: MouseEvent): void {
    if (!open) return
    const target = e.target as Node
    if (triggerEl?.contains(target) || listEl?.contains(target)) return
    open = false
  }

  $effect(() => {
    if (!open) return
    positionList()
    window.addEventListener('scroll', onReposition, true)
    window.addEventListener('resize', onReposition)
    document.addEventListener('mousedown', onOutsidePointer)
    return () => {
      window.removeEventListener('scroll', onReposition, true)
      window.removeEventListener('resize', onReposition)
      document.removeEventListener('mousedown', onOutsidePointer)
    }
  })

  function openList(): void {
    if (disabled) return
    activeIndex = selectedIndex >= 0 ? selectedIndex : 0
    open = true
  }

  function selectOption(index: number): void {
    const option = options[index]
    if (!option) return
    value = option.value
    open = false
    triggerEl?.focus()
    oninput?.(new Event('change'))
  }

  function focusOption(index: number): void {
    activeIndex = index
    const el = document.getElementById(optionId(index))
    el?.scrollIntoView?.({ block: 'nearest' })
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (disabled) return
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (!open) openList()
        else focusOption(activeIndex < options.length - 1 ? activeIndex + 1 : 0)
        break
      case 'ArrowUp':
        e.preventDefault()
        if (!open) openList()
        else focusOption(activeIndex > 0 ? activeIndex - 1 : options.length - 1)
        break
      case 'Home':
        if (open) {
          e.preventDefault()
          focusOption(0)
        }
        break
      case 'End':
        if (open) {
          e.preventDefault()
          focusOption(options.length - 1)
        }
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (open) {
          if (activeIndex >= 0) selectOption(activeIndex)
        } else {
          openList()
        }
        break
      case 'Escape':
        if (open) {
          e.preventDefault()
          open = false
          triggerEl?.focus()
        }
        break
      case 'Tab':
        open = false
        break
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          typeahead = (typeahead + e.key).toLowerCase()
          clearTimeout(typeaheadTimer)
          typeaheadTimer = setTimeout(() => { typeahead = '' }, 500)
          const match = options.findIndex((o, i) =>
            resolveLabel(o.label).toLowerCase().startsWith(typeahead)
          )
          if (match >= 0) focusOption(match)
        }
    }
  }

  /** Portal the options list into <body> so it escapes overflow/stacking contexts. */
  function portal(node: HTMLElement) {
    document.body.appendChild(node)
    return {
      destroy() {
        node.remove()
      }
    }
  }
</script>

<div class={twMerge(clsx('relative', className))}>
  <button
    bind:this={triggerEl}
    id={name}
    type="button"
    role="combobox"
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-controls={listId}
    aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
    aria-label={ariaLabel || undefined}
    aria-invalid={invalid || undefined}
    aria-disabled={disabled || undefined}
    aria-required={required || undefined}
    disabled={disabled}
    class={controlClass}
    onclick={() => (open ? (open = false) : openList())}
    onkeydown={handleKeydown}
  >
    <span class="truncate text-start">{selectedLabel}</span>
    <IconChevronDown
      class={clsx('size-4 shrink-0 text-pm-text-muted transition-transform', open && 'rotate-180')}
    />
  </button>

  <input type="hidden" {name} value={typeof value === 'string' ? value : ''} />

  {#if open}
    <div
      bind:this={listEl}
      id={listId}
      role="listbox"
      aria-label={ariaLabel || undefined}
      tabindex="-1"
      class="fixed z-[var(--z-dropdown)] max-h-60 overflow-y-auto rounded-md border border-pm-border bg-pm-bg-elevated py-1 shadow-lg"
      style="top:0;left:0"
      onkeydown={handleKeydown}
      use:portal
    >
      {#each options as opt, index (opt.value)}
        <button
          id={optionId(index)}
          type="button"
          role="option"
          data-option-value={opt.value}
          aria-selected={opt.value === value}
          tabindex="-1"
          class={clsx(
            'flex w-full items-center justify-between gap-2 px-3 py-2 text-sm text-start transition-colors',
            index === activeIndex ? 'bg-pm-bg-sunken text-pm-brand' : 'text-pm-text'
          )}
          onmouseenter={() => { activeIndex = index }}
          onmousedown={(e) => e.preventDefault()}
          onclick={() => selectOption(index)}
        >
          <span class="truncate">{resolveLabel(opt.label)}</span>
          {#if opt.value === value}
            <IconCheck class="size-4 shrink-0 text-pm-brand" />
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>
