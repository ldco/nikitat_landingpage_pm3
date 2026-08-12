<script lang="ts">
  /**
   * Admin Portfolio Edit — Edit portfolio form
   */
  import type { PageData } from './$types'
import { t } from '$lib/stores/content.svelte'
  import { page } from '$app/stores'
  import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
  import { getAdminT } from '$lib/utils/admin-translations'
  import { createFormDirty } from '$lib/utils/form-dirty.svelte'
  import FormField from '$lib/components/atoms/FormField.svelte'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  let { data }: { data: PageData } = $props()
  const p = $derived(data.portfolio)
  let name = $state(p.name), slug = $state(p.slug), type = $state(p.type), description = $state(p.description ?? '')
  const { isDirty, markClean, guardNavigation } = createFormDirty(() => ({ name: name }))
  markClean()
  guardNavigation()

  const adminT = $derived(getAdminT($page.data))
  const form = $derived($page.form)
  const errors = $derived((form as { fieldErrors?: Record<string, string[]> } | null)?.fieldErrors ?? {})

  const PORTFOLIO_TYPES = [
    { value: 'branding', key: 'admin.portfolioTypeBranding', fallback: 'Branding' },
    { value: 'gallery', key: 'admin.portfolioTypeGallery', fallback: 'Gallery' },
    { value: 'case_study', key: 'admin.portfolioTypeCaseStudy', fallback: 'Case Study' },
    { value: 'website', key: 'admin.portfolioTypeWebsite', fallback: 'Website' },
    { value: 'brandbook', key: 'admin.portfolioTypeBrandbook', fallback: 'Brandbook' }
  ]
</script>
<div class="max-w-[var(--max-w-content)] mx-auto">
  <div class="flex items-center gap-4 py-4 mb-6 border-b border-pm-border">
    <a href={ADMIN_ROUTES.portfolios} class="text-pm-text-muted hover:text-pm-brand text-sm">&larr; {t('common.back')}</a>
    <h1 class="text-2xl font-bold text-pm-text">{t('common.edit')}: {p.name}</h1>
    <CtaButton variant="secondary" size="compact" href={ADMIN_ROUTES.portfolioItems(p.id)}>
      {adminT['admin.manageItems'] ?? t('admin.manageItems')}
    </CtaButton>
  </div>
  <form method="POST" class="max-w-lg space-y-4">
    <input type="hidden" name="_csrf" value={$page.data.csrfToken} />
    <FormField
      name="name"
      label={adminT['admin.name'] ?? ''}
      bind:value={name}
      error={errors.name?.[0] ?? ''}
      required
    />
    <FormField
      name="slug"
      label={adminT['admin.slug'] ?? ''}
      bind:value={slug}
      error={errors.slug?.[0] ?? ''}
      required
    />
    <div>
      <label for="field-type" class="block text-sm font-medium text-pm-text mb-1">{adminT['admin.portfolioType']}</label>
      <select name="type" id="field-type" bind:value={type} class="w-full px-3 py-2 border border-pm-border rounded-lg bg-pm-bg text-pm-text">
        {#each PORTFOLIO_TYPES as pt}
          <option value={pt.value}>{adminT[pt.key] || pt.fallback}</option>
        {/each}
      </select>
      {#if errors.type?.[0]}<p class="text-xs text-pm-danger mt-1">{errors.type[0]}</p>{/if}
    </div>
    <FormField
      name="description"
      type="textarea"
      label={adminT['admin.description'] ?? ''}
      bind:value={description}
      error={errors.description?.[0] ?? ''}
    />
    <button type="submit" disabled={!isDirty} class="px-4 py-2 bg-pm-brand text-white rounded-lg hover:bg-pm-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors">{t('common.save')}</button>
  </form>
</div>
