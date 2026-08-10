<script lang="ts">
  import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
  import type { PageData } from './$types'
import { t } from '$lib/stores/content.svelte'
  import { page } from '$app/stores'
  import { getAdminT } from '$lib/utils/admin-translations'
  import { createFormDirty } from '$lib/utils/form-dirty.svelte'
  let { data }: { data: PageData } = $props()
  const item = $derived(data.item)
  // data is server-loaded, does not change during edit — init is intentional
  let slug = $state(item.slug)
  const { isDirty, markClean, guardNavigation } = createFormDirty(() => ({ slug: slug }))
  // Init clean after server-loaded data populates the form
  markClean()
  guardNavigation()

  const adminT = $derived(getAdminT($page.data))
  const form = $derived($page.form)
  const errors = $derived((form as { fieldErrors?: Record<string, string[]> } | null)?.fieldErrors ?? {})
</script>
<div class="max-w-[var(--max-w-content)] mx-auto">
  <div class="flex items-center gap-4 py-4 mb-6 border-b border-pm-border">
    <a href={ADMIN_ROUTES.faq} class="text-pm-text-muted hover:text-pm-brand text-sm">&larr; {t('common.back')}</a>
    <h1 class="text-2xl font-bold text-pm-text">{t('common.edit')}</h1>
  </div>
  <form method="POST" class="max-w-lg space-y-4">
    <input type="hidden" name="_csrf" value={$page.data.csrfToken} />
    <div>
      <label for="field-slug" class="block text-sm font-medium text-pm-text mb-1">{adminT['admin.slug']}</label>
      <input type="text" name="slug" id="field-slug" bind:value={slug} required class="w-full px-3 py-2 border border-pm-border rounded-lg bg-pm-bg text-pm-text" />
      {#if errors.slug?.[0]}<p class="text-xs text-pm-danger mt-1">{errors.slug[0]}</p>{/if}
    </div>
    <button type="submit" disabled={!isDirty} class="px-4 py-2 bg-pm-brand text-white rounded-lg hover:bg-pm-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors">{t('common.save')}</button>
  </form>
</div>
