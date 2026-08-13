<script lang="ts">
  /**
   * Admin Portfolio Create — New portfolio form
   */
  import { t } from '$lib/stores/content.svelte'
  import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
  import { page } from '$app/stores'
  import { getAdminT } from '$lib/utils/admin-translations'
  import AdminEditorPage from '$lib/components/molecules/AdminEditorPage.svelte'
  import FormField from '$lib/components/atoms/FormField.svelte'
  import AdminFormSection from '$lib/components/molecules/AdminFormSection.svelte'
  import FileUpload from '$lib/components/molecules/FileUpload.svelte'
  const adminT = $derived(getAdminT($page.data))

  const PORTFOLIO_TYPES = [
    { value: 'branding', key: 'admin.portfolioTypeBranding', fallback: 'Branding' },
    { value: 'gallery', key: 'admin.portfolioTypeGallery', fallback: 'Gallery' },
    { value: 'case_study', key: 'admin.portfolioTypeCaseStudy', fallback: 'Case Study' },
    { value: 'website', key: 'admin.portfolioTypeWebsite', fallback: 'Website' },
    { value: 'brandbook', key: 'admin.portfolioTypeBrandbook', fallback: 'Brandbook' }
  ]
  const typeOptions = $derived(
    PORTFOLIO_TYPES.map(pt => ({ value: pt.value, label: adminT[pt.key] ?? pt.fallback }))
  )

  let name = $state(''),
    slug = $state(''),
    type = $state('branding'),
    description = $state('')
  let coverImageUrl = $state('')
  let published = $state(false)
  const form = $derived($page.form)
  const errors = $derived(
    (form as { fieldErrors?: Record<string, string[]> } | null)?.fieldErrors ?? {}
  )
</script>

<AdminEditorPage
  title={t('common.create')}
  backHref={ADMIN_ROUTES.portfolios}
  csrfToken={$page.data.csrfToken}
>
  <AdminFormSection title={adminT['admin.basicInfo'] ?? t('admin.basicInfo')}>
    <div class="grid gap-4 grid-cols-[var(--grid-admin-form)]">
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
      <FormField
        name="type"
        type="select"
        label={adminT['admin.portfolioType'] ?? t('admin.portfolioType')}
        options={typeOptions}
        bind:value={type}
        error={errors.type?.[0] ? t(errors.type[0]) : ''}
      />
    </div>
  </AdminFormSection>

  <AdminFormSection title={adminT['admin.media'] ?? t('admin.media')}>
    <div class="flex flex-col gap-4">
      <FormField
        name="description"
        type="textarea"
        label={adminT['admin.description'] ?? t('admin.description')}
        bind:value={description}
        error={t(errors.description?.[0] ?? '')}
      />
      <input type="hidden" name="coverImageUrl" value={coverImageUrl} />
      <div class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-pm-text">
          {adminT['admin.coverImage'] ?? t('admin.coverImage')}
        </span>
        <FileUpload
          bind:value={coverImageUrl}
          dropzoneLabel={adminT['admin.dropzoneLabel'] ?? t('admin.dropzoneLabel')}
          uploadingLabel={t('common.uploading')}
          tooLargeLabel={adminT['admin.fileTooLarge'] ?? t('admin.fileTooLarge')}
          uploadFailedLabel={adminT['admin.uploadFailed'] ?? t('admin.uploadFailed')}
          removeLabel={t('common.remove')}
        />
      </div>
    </div>
  </AdminFormSection>

  <AdminFormSection title={adminT['admin.publicationStatus'] ?? t('admin.publicationStatus')}>
    <div class="flex flex-col gap-4">
      <FormField
        name="published"
        type="checkbox"
        label={adminT['admin.published'] ?? t('admin.published')}
        bind:value={published}
      />
    </div>
  </AdminFormSection>
</AdminEditorPage>
