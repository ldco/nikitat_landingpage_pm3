<script lang="ts">
  /**
   * AdminFormSection — card-style form section wrapper
   *
   * Provides a consistent bordered card container with optional title header.
   * Used by legal, settings, and all entity create/edit form pages.
   *
   * @props {string} [title=''] — section header title (i18n resolved by parent)
   * @props {string} [class] — additional CSS classes merged via twMerge
   * @slot children — section body content (form fields)
   *
   * @example
   * <AdminFormSection title={t('settings.general')}>
   *   <FormField name="siteName" label={t('settings.siteName')} bind:value={form.siteName} />
   * </AdminFormSection>
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  let {
    title = '',
    class: className = '',
    children
  }: {
    title?: string
    class?: string
    children?: import('svelte').Snippet
  } = $props()
</script>

<section class={twMerge(clsx(
  'bg-pm-bg-elevated border border-pm-border rounded-[var(--radius-xl)] overflow-hidden',
  className
))}>
  {#if title}
    <div class="flex items-center justify-between gap-4 px-6 py-4 border-b border-pm-border">
      <h2 class="text-lg font-semibold text-pm-text m-0">{title}</h2>
    </div>
  {/if}
  <div class="p-6">
    {@render children?.()}
  </div>
</section>
