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
  import PageHeader from '$lib/components/atoms/PageHeader.svelte'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import FormField from '$lib/components/atoms/FormField.svelte'
  import AdminFormSection from '$lib/components/molecules/AdminFormSection.svelte'
  let { data }: { data: PageData } = $props()
  const p = $derived(data.portfolio)
  let name = $state(p.name)
  let slug = $state(p.slug)
  let type = $state(p.type)
  let description = $state(p.description ?? '')
  let published = $state(p.published === true)
  // Dirty source covers EVERY editable field — a change to slug, type,
  // description or published enables Save just like a name change.
  const { isDirty, markClean, guardNavigation } = createFormDirty(() => ({
    name,
    slug,
    type,
    description,
    published
  }))
  markClean()
  guardNavigation()

  const adminT = $derived(getAdminT($page.data))
  const form = $derived($page.form)
  const errors = $derived(
    (form as { fieldErrors?: Record<string, string[]> } | null)?.fieldErrors ?? {}
  )

  const PORTFOLIO_TYPES = [
    { value: 'branding', key: 'admin.portfolioTypeBranding', fallback: 'Branding' },
    { value: 'gallery', key: 'admin.portfolioTypeGallery', fallback: 'Gallery' },
    { value: 'case_study', key: 'admin.portfolioTypeCaseStudy', fallback: 'Case Study' },
    { value: 'website', key: 'admin.portfolioTypeWebsite', fallback: 'Website' },
    { value: 'brandbook', key: 'admin.portfolioTypeBrandbook', fallback: 'Brandbook' }
  ]
</script>

<PageHeader title={adminT['admin.editPortfolio'] ?? t('admin.editPortfolio')}>
  {#snippet actions()}
    <a href={ADMIN_ROUTES.portfolios} class="text-pm-text-muted hover:text-pm-brand text-sm">
      &larr; {t('common.back')}
    </a>
    <CtaButton variant="secondary" size="compact" href={ADMIN_ROUTES.portfolioItems(p.id)}>
      {adminT['admin.manageItems'] ?? t('admin.manageItems')}
    </CtaButton>
  {/snippet}
</PageHeader>

<form method="POST" class="max-w-lg space-y-6">
  <input type="hidden" name="_csrf" value={$page.data.csrfToken} />

  <AdminFormSection>
    <div class="flex flex-col gap-4">
      <FormField
        name="name"
        label={adminT['admin.name'] ?? t('admin.name')}
        bind:value={name}
        error={t(errors.name?.[0] ?? '')}
        required
      />
      <FormField
        name="slug"
        label={adminT['admin.slug'] ?? t('admin.slug')}
        bind:value={slug}
        error={t(errors.slug?.[0] ?? '')}
        required
      />
      <div class="flex flex-col gap-1.5">
        <label for="field-type" class="text-sm font-medium text-pm-text">
          {adminT['admin.portfolioType']}
        </label>
        <select
          name="type"
          id="field-type"
          bind:value={type}
          class="w-full px-3 py-2 border border-pm-border rounded-md bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring"
        >
          {#each PORTFOLIO_TYPES as pt}
            <option value={pt.value}>{adminT[pt.key] || pt.fallback}</option>
          {/each}
        </select>
        {#if errors.type?.[0]}<p class="text-xs text-pm-danger mt-1">{t(errors.type[0])}</p>{/if}
      </div>
      <FormField
        name="description"
        type="textarea"
        label={adminT['admin.description'] ?? t('admin.description')}
        bind:value={description}
        error={t(errors.description?.[0] ?? '')}
      />
      <FormField
        name="published"
        type="checkbox"
        label={adminT['admin.published'] ?? t('admin.published')}
        bind:value={published}
      />
    </div>
  </AdminFormSection>

  <div class="flex justify-end gap-3">
    <CtaButton variant="ghost" href={ADMIN_ROUTES.portfolios}>{t('common.cancel')}</CtaButton>
    <CtaButton type="submit" variant="primary" disabled={!isDirty}>{t('common.save')}</CtaButton>
  </div>
</form>
