<script lang="ts">
  import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
  import type { PageData } from './$types'
import { t } from '$lib/stores/content.svelte'
  import { page } from '$app/stores'
  import { getAdminT } from '$lib/utils/admin-translations'
  import { createFormDirty } from '$lib/utils/form-dirty.svelte'
  import FormField from '$lib/components/atoms/FormField.svelte'
  let { data }: { data: PageData } = $props()
  const item = $derived(data.item)
  let slug = $state(item.slug)
  let order = $state(String(item.order ?? 0))
  const { isDirty, markClean, guardNavigation } = createFormDirty(() => ({ slug: slug, order: order }))
  markClean()
  guardNavigation()

  const adminT = $derived(getAdminT($page.data))
  const form = $derived($page.form)
  const errors = $derived((form as { fieldErrors?: Record<string, string[]> } | null)?.fieldErrors ?? {})
</script>
<div class="max-w-[var(--max-w-content)] mx-auto">
  <div class="flex items-center gap-4 py-4 mb-6 border-b border-pm-border">
    <a href={ADMIN_ROUTES.features} class="text-pm-text-muted hover:text-pm-brand text-sm">&larr; {t('common.back')}</a>
    <h1 class="text-2xl font-bold text-pm-text">{t('common.edit')}</h1>
  </div>
  <form method="POST" class="max-w-lg space-y-4">
    <input type="hidden" name="_csrf" value={$page.data.csrfToken} />
    <FormField
      name="slug"
      label={adminT['admin.slug'] ?? ''}
      bind:value={slug}
      error={errors.slug?.[0] ?? ''}
      required
    />
    <FormField
      name="order"
      type="number"
      label={adminT['admin.order'] ?? ''}
      bind:value={order}
      error={errors.order?.[0] ?? ''}
    />
    <button type="submit" disabled={!isDirty} class="px-4 py-2 bg-pm-brand text-white rounded-lg hover:bg-pm-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors">{t('common.save')}</button>
  </form>
</div>
