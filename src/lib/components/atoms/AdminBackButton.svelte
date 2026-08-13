<script lang="ts">
  /**
   * AdminBackButton — back/navigation action for `PageHeader` actions rows.
   *
   * The canonical "← Back" link of admin editor pages (replaces the raw
   * `<a class="text-pm-text-muted hover:text-pm-brand text-sm">&larr; …</a>`
   * bundles previously hand-rolled in every create/edit page).
   *
   * @props {string} href — destination (usually the entity list route)
   * @props {string} [label] — link label (defaults to t('common.back'))
   * @props {string} [class] — additional CSS classes merged via twMerge
   *
   * @example
   * <AdminBackButton href={ADMIN_ROUTES.blog} />
   */
  import { t } from '$lib/stores/content.svelte'
  import CtaButton from './CtaButton.svelte'
  import IconArrowLeft from '@tabler/icons-svelte/icons/arrow-left'

  let {
    href,
    label,
    class: className = ''
  }: {
    href: string
    label?: string
    class?: string
  } = $props()
</script>

<CtaButton variant="ghost" size="sm" {href} class={className}>
  <IconArrowLeft class="size-4" />
  {label ?? t('common.back')}
</CtaButton>
