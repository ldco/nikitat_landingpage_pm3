<script lang="ts">
  /**
   * AdminCreateButton — primary "+ label" header action for admin list pages.
   *
   * The canonical list-page primary action (replaces the repeated
   * `<CtaButton variant="primary" size="sm"><IconPlus/> label</CtaButton>`
   * bundles). Renders a link when `href` is set, otherwise a button.
   *
   * @props {string} [href] — render an anchor instead of a button
   * @props {(e: MouseEvent) => void} [onclick] — click handler
   * @props {string} [label] — button label (defaults to t('common.create'))
   * @props {string} [class] — additional CSS classes merged via twMerge
   *
   * @example
   * <AdminCreateButton href={ADMIN_ROUTES.blogCreate} />
   * <AdminCreateButton onclick={openCreate} label={t('admin.addItem')} />
   */
  import { t } from '$lib/stores/content.svelte'
  import CtaButton from './CtaButton.svelte'
  import IconPlus from '@tabler/icons-svelte/icons/plus'

  let {
    href,
    onclick,
    label,
    class: className = ''
  }: {
    href?: string
    onclick?: (e: MouseEvent) => void
    label?: string
    class?: string
  } = $props()
</script>

<CtaButton variant="primary" size="sm" {href} {onclick} class={className}>
  <IconPlus class="size-4" />
  {label ?? t('common.create')}
</CtaButton>
