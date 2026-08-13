<script lang="ts">
  /**
   * AdminModal — reusable admin CRUD modal dialog
   *
   * Wraps arbitrary form content in a centered modal with backdrop,
   * header, and footer with cancel/submit buttons.
   *
   * @props {boolean} open — controls visibility
   * @props {string} title — header title text (i18n key resolved by parent)
   * @props {string} [maxWidthClass='max-w-md'] — Tailwind max-width class
   * @props {string} [cancelLabel=''] — cancel button text
   * @props {string} [submitLabel=''] — submit button text
   * @props {boolean} [submitDisabled=false] — disables submit button
   * @props {boolean} [loading=false] — shows loading state on submit button
   * @props {string} [formAction=''] — when set, the inner form submits natively
   *   to this SvelteKit action (`?/create`) with method POST (the admin form
   *   contract: Zod + fail(400, { fieldErrors }) in +page.server.ts). The
   *   submit button becomes a real submit; `onsubmit` is ignored. Children
   *   must include the `_csrf` hidden input.
   * @props {string} [class] — additional CSS classes merged via twMerge
   * @props {() => void} onclose — called on backdrop click, close button, or Escape
   * @props {() => void} onsubmit — called on form submit (after preventDefault)
   *
   * @slot children — form body content
   * @slot badge — optional badge/indicator rendered after the title in the header
   * @slot footer — optional custom footer (overrides default cancel+submit buttons)
   *
   * @example
   * <AdminModal open={showModal} title="Add User" onclose={() => showModal = false} onsubmit={handleSave}>
   *   <FormField name="email" label="Email" bind:value={email} />
   * </AdminModal>
   *
   * @example
   * <AdminModal open={showModal} title="Edit User" formAction="?/update" onclose={closeModal}>
   *   <input type="hidden" name="_csrf" value={$page.data.csrfToken} />
   *   <input type="hidden" name="id" value={editingUser.id} />
   *   <FormField name="email" label="Email" bind:value={formEmail} />
   * </AdminModal>
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { enhance } from '$app/forms'
  import IconX from '@tabler/icons-svelte/icons/x'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'

  let {
    open = false,
    title = '',
    maxWidthClass = 'max-w-md',
    cancelLabel = '',
    submitLabel = '',
    submitDisabled = false,
    loading = false,
    formAction = '',
    class: className = '',
    onclose,
    onsubmit,
    children,
    badge,
    footer
  }: {
    open: boolean
    title: string
    maxWidthClass?: string
    cancelLabel?: string
    submitLabel?: string
    submitDisabled?: boolean
    loading?: boolean
    formAction?: string
    class?: string
    onclose: () => void
    onsubmit?: () => void
    children?: import('svelte').Snippet
    badge?: import('svelte').Snippet
    footer?: import('svelte').Snippet
  } = $props()

  // Prevent body scroll when modal is open
  $effect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
  })
</script>

{#if open}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-[var(--z-modal-backdrop)] flex items-center justify-center bg-black/50 p-4"
    onclick={onclose}
    onkeydown={e => {
      if (e.key === 'Escape') onclose()
    }}
    role="dialog"
    aria-modal="true"
  >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class={twMerge(
        clsx(
          'bg-pm-bg-elevated rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] w-full max-h-[var(--dialog-max-height)] overflow-auto',
          maxWidthClass,
          className
        )
      )}
      onclick={e => e.stopPropagation()}
      role="presentation"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-pm-border">
        <h2 class="text-lg font-semibold text-pm-text flex items-center gap-2">
          {title}
          {#if badge}{@render badge()}{/if}
        </h2>
        <button
          type="button"
          class="p-1 text-pm-text-muted hover:text-pm-text rounded-md transition-colors shrink-0"
          onclick={onclose}
          aria-label={cancelLabel}
        >
          <IconX class="size-5" />
        </button>
      </div>

      <!-- Body (form content) -->
      {#if formAction}
        <!-- use:enhance keeps the modal open across fail(400, { fieldErrors }):
             the submission is fetched and $page.form updates in place instead of
             a native POST that would remount the page and close the modal.
             Successful saves REDIRECT (303) — the callback closes the modal on
             the redirect result so the save visibly completes, then revalidates
             the page (same-page redirect) or follows the navigation. -->
        <form
          method="POST"
          action={formAction}
          use:enhance={() => async ({ result, update }) => {
            if (result.type === 'redirect') onclose()
            await update()
          }}
          class="p-6 flex flex-col gap-4"
        >
          {@render children?.()}

          {#if footer}
            {@render footer()}
          {:else}
            <div class="flex justify-end gap-3 pt-2">
              <CtaButton variant="ghost" size="compact" onclick={onclose} type="button">
                {cancelLabel}
              </CtaButton>
              <CtaButton
                variant="primary"
                size="compact"
                type="submit"
                disabled={submitDisabled || loading}
              >
                {loading ? '...' : submitLabel}
              </CtaButton>
            </div>
          {/if}
        </form>
      {:else}
        <form
          class="p-6 flex flex-col gap-4"
          onsubmit={e => {
            e.preventDefault()
            onsubmit?.()
          }}
        >
          {@render children?.()}

          {#if footer}
            {@render footer()}
          {:else}
            <div class="flex justify-end gap-3 pt-2">
              <CtaButton variant="ghost" size="compact" onclick={onclose} type="button">
                {cancelLabel}
              </CtaButton>
              <CtaButton
                variant="primary"
                size="compact"
                type="submit"
                disabled={submitDisabled || loading}
              >
                {loading ? '...' : submitLabel}
              </CtaButton>
            </div>
          {/if}
        </form>
      {/if}
    </div>
  </div>
{/if}
