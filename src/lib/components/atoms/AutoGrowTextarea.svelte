<script lang="ts">
  /**
   * AutoGrowTextarea — textarea that grows with its content
   *
   * Replaces fixed-`rows` keyholes for long-form editing: the box starts at
   * `rows` lines and automatically expands as the user types (or when the
   * value is set programmatically), up to `--textarea-max-height` (80dvh),
   * after which it scrolls. Used by FormField textareas and the translations
   * editor modal so every multi-line field shares the same behavior.
   *
   * All other textarea attributes (placeholder, required, dir, disabled,
   * aria-label, …) and event handlers are forwarded to the underlying
   * element; `bind:value` is supported.
   *
   * @props {string} [value] — bound value (two-way via bind:value; binding an
   *   expression that is undefined at first render is legal — no fallback, so
   *   `bind:value={obj.maybeUndefined}` never throws props_invalid_value)
   * @props {number} [rows=3] — starting row count (grows from here)
   * @props {string} [class] — extra classes merged via twMerge
   *
   * @example
   * <AutoGrowTextarea rows={3} bind:value={body} required dir="auto" />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  let {
    value = $bindable(),
    rows = 3,
    class: className = '',
    ...restProps
  }: {
    value?: string
    rows?: number
    class?: string
  } & import('svelte/elements').HTMLTextareaAttributes = $props()

  let el = $state<HTMLTextAreaElement>()

  function resize(): void {
    const node = el
    if (!node) return
    node.style.height = 'auto'
    node.style.height = `${node.scrollHeight}px`
  }

  // Re-size on mount, on bind:this, and whenever the value changes (typing or
  // programmatic). Reading `value` and `el` makes the effect re-run on both.
  $effect(() => {
    void value
    resize()
  })
</script>

<textarea
  bind:this={el}
  bind:value={value}
  {rows}
  class={twMerge(clsx(
    'w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text resize-none overflow-y-auto max-h-[var(--textarea-max-height)] focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring',
    className
  ))}
  {...restProps}
></textarea>
