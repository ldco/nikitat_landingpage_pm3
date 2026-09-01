<script lang="ts">
  /**
   * ConfirmDialog — Modal dialog (PM v2 modal.css design)
   *
   * Source: app-nuxt/app/assets/css/ui/overlays/modal.css (253 lines)
   * Rule #1: class prop + twMerge
   * Rule #6: $bindable for open state
   *
   * Two usage modes:
   *  1. Imperative (preferred): mounted by <OverlayProvider> and driven by
   *     getOverlaysState().confirm({ ... }). No props required.
   *  2. Declarative: <ConfirmDialog bind:open title=... onConfirm=... />.
   *
   * @props {boolean} [open=false] — bindable open state (declarative mode)
   * @props {string} [title] — dialog title
   * @props {string} [message] — confirmation message
   * @props {string} [confirmText] — confirm button label
   * @props {string} [cancelText] — cancel button label
   * @props {'primary'|'danger'} [variant='primary'] — confirm button variant
   * @props {() => void} [onConfirm] — confirm callback (declarative mode)
   * @props {string} [class] — additional CSS classes merged via twMerge
   *
   * @example
   * <ConfirmDialog bind:open={open} title="Delete item?" onConfirm={handleDelete} />
   */
  import { t } from '$lib/stores/content.svelte'
  import { getOverlaysState } from '$lib/stores/overlays.svelte'
  import FormActions from '$lib/components/molecules/FormActions.svelte'

  let {
    open = $bindable(false),
    title = t('common.confirm'),
    message = t('common.areYouSure'),
    confirmText = t('common.confirm'),
    cancelText = t('common.cancel'),
    variant = 'primary' as 'primary' | 'danger',
    onConfirm,
    class: className = ''
  }: {
    open?: boolean
    title?: string
    message?: string
    confirmText?: string
    cancelText?: string
    variant?: 'primary' | 'danger'
    onConfirm?: () => void
    class?: string
  } = $props()

  const overlays = getOverlaysState()
  const storeRequest = $derived(overlays.confirmRequest)

  // Imperative mode: the store owns the visible request.
  const isStoreDriven = $derived(storeRequest !== null)
  const isOpen = $derived(isStoreDriven ? true : open)
  const activeTitle = $derived(isStoreDriven ? (storeRequest?.title ?? t('common.confirm')) : title)
  const activeMessage = $derived(isStoreDriven ? (storeRequest?.message ?? t('common.areYouSure')) : message)
  const activeConfirmText = $derived(isStoreDriven ? (storeRequest?.confirmText ?? t('common.confirm')) : confirmText)
  const activeCancelText = $derived(isStoreDriven ? (storeRequest?.cancelText ?? t('common.cancel')) : cancelText)
  const activeVariant = $derived(isStoreDriven ? (storeRequest?.variant ?? 'primary') : variant)

  $effect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isStoreDriven) overlays.resolveConfirm(false)
        else open = false
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  function handleConfirm() {
    if (isStoreDriven) {
      overlays.resolveConfirm(true)
    } else {
      onConfirm?.()
      open = false
    }
  }

  function handleCancel() {
    if (isStoreDriven) {
      overlays.resolveConfirm(false)
    } else {
      open = false
    }
  }
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-[var(--z-modal-backdrop)] flex items-center justify-center bg-black/50 p-4"
    onclick={handleCancel}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div
      class="bg-pm-bg rounded-lg shadow-xl w-full max-w-md max-h-[var(--dialog-max-height)] overflow-auto"
      onclick={(e) => e.stopPropagation()}
      role="presentation"
    >
      <!-- .modal-body: p-6 -->
      <div class="p-6">
        <h3 class="text-lg font-semibold text-pm-text m-0 leading-normal">{activeTitle}</h3>
        <p class="mt-2 text-sm text-pm-text-secondary m-0">{activeMessage}</p>
      </div>
      <!-- .modal-footer: FormActions divider strip (border-top, compact actions) -->
      <FormActions
        variant="divider"
        class={className}
        cancelLabel={activeCancelText}
        onCancel={handleCancel}
        submitLabel={activeConfirmText}
        submitVariant={activeVariant}
        submitType="button"
        onSubmit={handleConfirm}
      />
    </div>
  </div>
{/if}
