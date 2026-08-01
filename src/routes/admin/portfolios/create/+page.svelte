<script lang="ts">
  /**
   * Admin Portfolio Create — New portfolio form
   */
  import * as m from '$lib/i18n'
  import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
  import { page } from '$app/stores'
  import { getAdminT } from '$lib/utils/admin-translations'
  const t = $derived(getAdminT($page.data))
  let name = $state(''), slug = $state(''), type = $state('branding'), description = $state('')
</script>
<div class="max-w-content mx-auto">
  <div class="flex items-center gap-4 py-4 mb-6 border-b border-pm-border">
    <a href=ADMIN_ROUTES.portfolios class="text-pm-text-muted hover:text-pm-brand text-sm">&larr; {m.common_back()}</a>
    <h1 class="text-2xl font-bold text-pm-text">{m.common_create()}</h1>
  </div>
  <form method="POST" class="max-w-lg space-y-4">
    <div><label class="block text-sm font-medium text-pm-text mb-1">{t['admin.name']}</label><input type="text" name="name" bind:value={name} required class="w-full px-3 py-2 border border-pm-border rounded-lg bg-pm-bg text-pm-text" /></div>
    <div><label class="block text-sm font-medium text-pm-text mb-1">{t['admin.slug']}</label><input type="text" name="slug" bind:value={slug} required class="w-full px-3 py-2 border border-pm-border rounded-lg bg-pm-bg text-pm-text" /></div>
    <div><label class="block text-sm font-medium text-pm-text mb-1">{t['admin.portfolioType']}</label><select name="type" bind:value={type} class="w-full px-3 py-2 border border-pm-border rounded-lg bg-pm-bg text-pm-text">
      <option value="branding">Branding</option><option value="gallery">Gallery</option><option value="case_study">Case Study</option><option value="website">Website</option><option value="brandbook">Brandbook</option>
    </select></div>
    <div><label class="block text-sm font-medium text-pm-text mb-1">{t['admin.description']}</label><textarea name="description" bind:value={description} rows="3" class="w-full px-3 py-2 border border-pm-border rounded-lg bg-pm-bg text-pm-text"></textarea></div>
    <button type="submit" class="px-4 py-2 bg-pm-brand text-white rounded-lg hover:bg-pm-brand-dark transition-colors">{m.common_save()}</button>
  </form>
</div>
