<script lang="ts">
  /**
   * Admin Blog Post Create — New post form
   */
  import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
import { t } from '$lib/stores/content.svelte'
  import { page } from '$app/stores'
  import { getAdminT } from '$lib/utils/admin-translations'
  const adminT = $derived(getAdminT($page.data))
  let slug = $state('')
  const form = $derived($page.form)
  const errors = $derived((form as { fieldErrors?: Record<string, string[]> } | null)?.fieldErrors ?? {})
</script>
<div class="max-w-[var(--max-w-content)] mx-auto">
  <div class="flex items-center gap-4 py-4 mb-6 border-b border-pm-border">
    <a href={ADMIN_ROUTES.blog} class="text-pm-text-muted hover:text-pm-brand text-sm">&larr; {t('common.back')}</a>
    <h1 class="text-2xl font-bold text-pm-text">{t('common.create')}</h1>
  </div>
  <form method="POST" class="max-w-lg space-y-4">
    <input type="hidden" name="_csrf" value={$page.data.csrfToken} />
    <div>
      <label for="field-slug" class="block text-sm font-medium text-pm-text mb-1">{adminT['admin.slug']}</label>
      <input type="text" name="slug" id="field-slug" bind:value={slug} required class="w-full px-3 py-2 border border-pm-border rounded-lg bg-pm-bg text-pm-text" />
      {#if errors.slug?.[0]}
        <p class="text-xs text-pm-danger mt-1">{errors.slug[0]}</p>
      {/if}
    </div>
    <button type="submit" class="px-4 py-2 bg-pm-brand text-white rounded-lg hover:bg-pm-brand-dark transition-colors">{t('common.save')}</button>
  </form>
</div>
