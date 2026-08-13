<script lang="ts">
  /**
   * AdminRowActions — canonical presentation for admin table row actions.
   *
   * The shared right-aligned, equal-gap flex row that holds the row action
   * buttons (edit/delete/…) of every admin list page. Replace the repeated
   * `<div class="flex items-center justify-end gap-1">` bundles with this
   * primitive so row actions render identically across modules.
   *
   * @props {string} [class] — additional CSS classes merged via twMerge
   * @props {Snippet} children — the IconButton actions for the row
   *
   * @example
   * <AdminRowActions>
   *   <IconButton href={editHref} ariaLabel={t('common.edit')}>
   *     <IconPencil class="size-4" />
   *   </IconButton>
   * </AdminRowActions>
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  let {
    class: className = '',
    children
  }: {
    class?: string
    children?: import('svelte').Snippet
  } = $props()
</script>

<div class={twMerge(clsx('flex items-center justify-end gap-1', className))}>
  {@render children?.()}
</div>
