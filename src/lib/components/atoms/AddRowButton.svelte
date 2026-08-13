<script lang="ts">
  /**
   * AddRowButton — inline add-row action for repeatable form field groups
   *
   * Renders the brand-colored "+ label" text action used to append a row to a
   * repeatable field group (portfolio sections/pages/screenshots). Owns the
   * `inline-flex items-center gap-1 self-start text-sm text-pm-brand
   * hover:text-pm-brand-light` bundle so repeatable editors never hand-roll it.
   *
   * @props {() => void} onclick — append-row callback
   * @props {string} [class] — extra classes merged via twMerge
   * @props {Snippet} children — button label (i18n string)
   *
   * @example
   * <AddRowButton onclick={addSection}>{t('admin.addRow')}</AddRowButton>
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import IconPlus from '@tabler/icons-svelte/icons/plus'

  let {
    onclick,
    class: className = '',
    children
  }: {
    onclick: () => void
    class?: string
    children?: import('svelte').Snippet
  } = $props()

  const merged = $derived(
    twMerge(
      clsx(
        'inline-flex items-center gap-1 self-start text-sm text-pm-brand hover:text-pm-brand-light transition-colors',
        className
      )
    )
  )
</script>

<button type="button" class={merged} onclick={onclick}>
  <IconPlus class="size-4" />
  {@render children?.()}
</button>
