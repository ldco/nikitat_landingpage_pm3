<script lang="ts">
  /**
   * InlineBannerAction — lightweight inline text action inside banner alerts.
   *
   * The canonical dismiss/retry link inside error/warning banners (replaces
   * the raw `<button class="ms-2 underline hover:no-underline">` bundles
   * hand-rolled in admin list pages).
   *
   * @props {'button'|'submit'} [type='button'] — button type
   * @props {(e: MouseEvent) => void} [onclick] — click handler
   * @props {string} [class] — additional CSS classes merged via twMerge
   * @props {Snippet} children — action label (i18n resolved by parent)
   *
   * @example
   * <InlineBannerAction onclick={() => (deleteError = null)}>
   *   {t('common.dismiss')}
   * </InlineBannerAction>
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  let {
    type = 'button',
    onclick,
    class: className = '',
    children
  }: {
    type?: 'button' | 'submit'
    onclick?: (e: MouseEvent) => void
    class?: string
    children?: import('svelte').Snippet
  } = $props()
</script>

<button {type} {onclick} class={twMerge(clsx('ms-2 underline hover:no-underline', className))}>
  {@render children?.()}
</button>
