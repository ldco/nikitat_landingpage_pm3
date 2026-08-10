<script lang="ts">
  /**
   * Admin Portfolio Create — New portfolio form
   */
  import * as m from '$lib/i18n'
  import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
  import { page } from '$app/stores'
  import { getAdminT } from '$lib/utils/admin-translations'
  const t = $derived(getAdminT($page.data))

  const PORTFOLIO_TYPES = [
    { value: 'branding', key: 'admin.portfolioTypeBranding', fallback: 'Branding' },
    { value: 'gallery', key: 'admin.portfolioTypeGallery', fallback: 'Gallery' },
    { value: 'case_study', key: 'admin.portfolioTypeCaseStudy', fallback: 'Case Study' },
    { value: 'website', key: 'admin.portfolioTypeWebsite', fallback: 'Website' },
    { value: 'brandbook', key: 'admin.portfolioTypeBrandbook', fallback: 'Brandbook' }
  ]

  let name = $state(''), slug = $state(''), type = $state('branding'), description = $state('')
  const form = $derived($page.form)
  const errors = $derived((form as { fieldErrors?: Record<string, string[]> } | null)?.fieldErrors ?? {})
</script>
<div class="max-w-[var(--max-w-content)] mx-auto">
  <div class="flex items-center gap-4 py-4 mb-6 border-b border-pm-border">
    <a href={ADMIN_ROUTES.portfolios} class="text-pm-text-muted hover:text-pm-brand text-sm">&larr; {m.common_back()}</a>
    <h1 class="text-2xl font-bold text-pm-text">{m.common_create()}</h1>
  </div>
  <form method="POST" class="max-w-lg space-y-4">
    <div>
      <label for="field-name" class="block text-sm font-medium text-pm-text mb-1">{t['admin.name']}</label>
      <input type="text" name="name" id="field-name" bind:value={name} required class="w-full px-3 py-2 border border-pm-border rounded-lg bg-pm-bg text-pm-text" />
      {#if errors.name?.[0]}<p class="text-xs text-pm-danger mt-1">{errors.name[0]}</p>{/if}
    </div>
    <div>
      <label for="field-slug" class="block text-sm font-medium text-pm-text mb-1">{t['admin.slug']}</label>
      <input type="text" name="slug" id="field-slug" bind:value={slug} required class="w-full px-3 py-2 border border-pm-border rounded-lg bg-pm-bg text-pm-text" />
      {#if errors.slug?.[0]}<p class="text-xs text-pm-danger mt-1">{errors.slug[0]}</p>{/if}
    </div>
    <div>
      <label for="field-type" class="block text-sm font-medium text-pm-text mb-1">{t['admin.portfolioType']}</label>
      <select name="type" id="field-type" bind:value={type} class="w-full px-3 py-2 border border-pm-border rounded-lg bg-pm-bg text-pm-text">
        {#each PORTFOLIO_TYPES as pt}
          <option value={pt.value}>{t[pt.key] || pt.fallback}</option>
        {/each}
      </select>
      {#if errors.type?.[0]}<p class="text-xs text-pm-danger mt-1">{errors.type[0]}</p>{/if}
    </div>
    <div>
      <label for="field-description" class="block text-sm font-medium text-pm-text mb-1">{t['admin.description']}</label>
      <textarea name="description" id="field-description" bind:value={description} rows="3" class="w-full px-3 py-2 border border-pm-border rounded-lg bg-pm-bg text-pm-text"></textarea>
      {#if errors.description?.[0]}<p class="text-xs text-pm-danger mt-1">{errors.description[0]}</p>{/if}
    </div>
    <button type="submit" class="px-4 py-2 bg-pm-brand text-white rounded-lg hover:bg-pm-brand-dark transition-colors">{m.common_save()}</button>
  </form>
</div>
