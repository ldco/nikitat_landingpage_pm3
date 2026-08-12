<script lang="ts">
  /**
   * Admin Portfolio Create — New portfolio form
   */
  import { t } from '$lib/stores/content.svelte'
  import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
  import { page } from '$app/stores'
  import { getAdminT } from '$lib/utils/admin-translations'
  import PageHeader from '$lib/components/atoms/PageHeader.svelte'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import FormField from '$lib/components/atoms/FormField.svelte'
  import AdminFormSection from '$lib/components/molecules/AdminFormSection.svelte'
  const adminT = $derived(getAdminT($page.data))

  const PORTFOLIO_TYPES = [
    { value: 'branding', key: 'admin.portfolioTypeBranding', fallback: 'Branding' },
    { value: 'gallery', key: 'admin.portfolioTypeGallery', fallback: 'Gallery' },
    { value: 'case_study', key: 'admin.portfolioTypeCaseStudy', fallback: 'Case Study' },
    { value: 'website', key: 'admin.portfolioTypeWebsite', fallback: 'Website' },
    { value: 'brandbook', key: 'admin.portfolioTypeBrandbook', fallback: 'Brandbook' }
  ]

  let name = $state(''),
    slug = $state(''),
    type = $state('branding'),
    description = $state('')
  let published = $state(false)
  const form = $derived($page.form)
  const errors = $derived(
    (form as { fieldErrors?: Record<string, string[]> } | null)?.fieldErrors ?? {}
  )
</script>

<PageHeader title={adminT['admin.addPortfolio'] ?? t('admin.addPortfolio')}>
  {#snippet actions()}
    <a href={ADMIN_ROUTES.portfolios} class="text-pm-text-muted hover:text-pm-brand text-sm">
      &larr; {t('common.back')}
    </a>
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
    <CtaButton type="submit" variant="primary">{t('common.save')}</CtaButton>
  </div>
</form>
