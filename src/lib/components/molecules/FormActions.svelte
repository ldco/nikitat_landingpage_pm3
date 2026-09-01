<script lang="ts">
  /**
   * FormActions — standardized form-action footer bar
   *
   * The canonical container for Cancel/Save (and any extra) action buttons at
   * the bottom of admin forms, dialogs and settings pages. Replaces the
   * hand-rolled `flex justify-end gap-*` rows that floated uncontained in page
   * white space and drifted in size.
   *
   * Buttons are rendered by THIS component (never hand-placed by callers) so
   * the action scale is enforced: both actions use CtaButton size "compact"
   * (px-4/py-2/text-sm — the same scale as the SegmentedControl language tabs)
   * while Cancel is a muted ghost (secondary/tertiary weight) and Submit is the
   * primary solid. Pass an optional `extra` snippet for additional actions and
   * a `hint` snippet for left-aligned context text (the bar splits hint left /
   * actions right).
   *
   * Two container modes:
   *   - `bar` (default): standalone elevated card for page-level forms
   *     (AdminEditorPage, settings, legal) — matches the AdminFormSection card
   *     aesthetic so the actions never break the container system.
   *   - `divider`: bordered-top strip for footers inside a modal/dialog card
   *     (AdminModal, ConfirmDialog, ChangePasswordModal). When nested inside an
   *     already-padded container (e.g. `<form class="p-6 …">`), override the
   *     horizontal/bottom padding via the class prop (`px-0 pb-0`).
   *
   * @props {string} submitLabel — submit action label (i18n resolved by parent)
   * @props {'primary'|'danger'} [submitVariant='primary'] — submit button variant
   * @props {'submit'|'button'} [submitType='submit'] — submit button type
   * @props {boolean} [submitDisabled=false] — disables the submit button
   * @props {() => void} [onSubmit] — submit click handler (used when submitType='button')
   * @props {string} [cancelLabel] — optional cancel label; omitting hides the cancel action
   * @props {string} [cancelHref] — optional cancel link target (renders an anchor)
   * @props {() => void} [onCancel] — optional cancel click handler (renders a button)
   * @props {'bar'|'divider'} [variant='bar'] — container mode (standalone card vs in-card strip)
   * @props {string} [class] — additional CSS classes merged via twMerge
   * @props {Snippet} [hint] — left-aligned supporting text next to the actions
   * @props {Snippet} [extra] — additional actions rendered before the submit button
   *
   * @example
   * <FormActions
   *   cancelLabel={t('common.cancel')}
   *   cancelHref={ADMIN_ROUTES.blog}
   *   submitLabel={t('common.save')}
   *   submitDisabled={saving}
   * />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'

  let {
    submitLabel,
    submitVariant = 'primary',
    submitType = 'submit',
    submitDisabled = false,
    onSubmit,
    cancelLabel,
    cancelHref,
    onCancel,
    variant = 'bar',
    class: className = '',
    hint,
    extra
  }: {
    submitLabel: string
    submitVariant?: 'primary' | 'danger'
    submitType?: 'submit' | 'button'
    submitDisabled?: boolean
    onSubmit?: () => void
    cancelLabel?: string
    cancelHref?: string
    onCancel?: () => void
    variant?: 'bar' | 'divider'
    class?: string
    hint?: import('svelte').Snippet
    extra?: import('svelte').Snippet
  } = $props()

  const container = $derived(
    variant === 'bar'
      ? 'bg-[var(--card-shell-bg)] border border-pm-border rounded-[var(--card-shell-radius)] px-[var(--card-shell-pad-x)] py-4'
      : 'border-t border-pm-border px-[var(--card-shell-pad-x)] py-4'
  )

  const cancelClasses = 'text-pm-text-secondary hover:text-pm-text'
</script>

<div class={twMerge(clsx('flex flex-wrap items-center gap-4', container, className))}>
  {#if hint}
    <div class="min-w-0 text-sm text-pm-text-muted">
      {@render hint()}
    </div>
  {/if}
  <div class="flex flex-wrap items-center gap-3 ms-auto">
    {#if cancelLabel}
      {#if cancelHref}
        <CtaButton variant="ghost" size="compact" href={cancelHref} class={cancelClasses}>
          {cancelLabel}
        </CtaButton>
      {:else}
        <CtaButton variant="ghost" size="compact" type="button" onclick={onCancel} class={cancelClasses}>
          {cancelLabel}
        </CtaButton>
      {/if}
    {/if}
    {@render extra?.()}
    <CtaButton type={submitType} variant={submitVariant} size="compact" disabled={submitDisabled} onclick={onSubmit}>
      {submitLabel}
    </CtaButton>
  </div>
</div>
