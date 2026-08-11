<script lang="ts">
  import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
import { t } from '$lib/stores/content.svelte'
  import { page } from '$app/stores'
  import { getAdminT } from '$lib/utils/admin-translations'
  import FormField from '$lib/components/atoms/FormField.svelte'
  const adminT = $derived(getAdminT($page.data))
  let slug = $state('')
  const form = $derived($page.form)
  const errors = $derived((form as { fieldErrors?: Record<string, string[]> } | null)?.fieldErrors ?? {})
</script>
<div class="max-w-[var(--max-w-content)] mx-auto">
  <div class="flex items-center gap-4 py-4 mb-6 border-b border-pm-border">
    <a href={ADMIN_ROUTES.features} class="text-pm-text-muted hover:text-pm-brand text-sm">&larr; {t('common.back')}</a>
    <h1 class="text-2xl font-bold text-pm-text">{t('common.create')}</h1>
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
    <button type="submit" class="px-4 py-2 bg-pm-brand text-white rounded-lg hover:bg-pm-brand-dark transition-colors">{t('common.save')}</button>
  </form>
</div>
