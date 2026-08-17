<script lang="ts">
  /**
   * Admin Portfolio Settings — PM2-parity split editor.
   *
   * This route edits the portfolio's METADATA (name, slug, type, description,
   * cover image, published) — the "settings" of a portfolio. The actual
   * content (portfolio items) is edited on the content route
   * (`ADMIN_ROUTES.portfolioItems`), mirroring PM2's
   * `api/admin/portfolios/[id]/items` surface. The header CTA makes that
   * split unmistakable: "Edit content" is the primary action from here.
   */
  import type { PageData } from './$types'
  import { t } from '$lib/stores/content.svelte'
  import { page } from '$app/stores'
  import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
  import { getAdminT } from '$lib/utils/admin-translations'
  import { createFormDirty } from '$lib/utils/form-dirty.svelte'
  import { LOCALES, DEFAULT_LOCALE, LOCALE_CONFIG } from '$lib/config/site'
  import AdminEditorPage from '$lib/components/molecules/AdminEditorPage.svelte'
  import AdminFormSection from '$lib/components/molecules/AdminFormSection.svelte'
  import AdminLocaleTextFields from '$lib/components/molecules/AdminLocaleTextFields.svelte'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import FormField from '$lib/components/atoms/FormField.svelte'
  import FileUpload from '$lib/components/molecules/FileUpload.svelte'
  import IconPencil from '@tabler/icons-svelte/icons/pencil'
  let { data }: { data: PageData } = $props()
  const p = $derived(data.portfolio)
  let name = $state(p.name)
  let slug = $state(p.slug)
  let type = $state(p.type)
  let description = $state(p.description ?? '')
  let coverImageUrl = $state(p.coverImageUrl ?? '')
  let published = $state(p.published === true)
  // Dirty source covers EVERY editable field — a change to slug, type,
  // description, coverImageUrl or published enables Save just like a name change.
  const { isDirty, markClean, guardNavigation } = createFormDirty(() => ({
    name,
    slug,
    type,
    description,
    coverImageUrl,
    published
  }))
  markClean()
  // The form element arms the submit bypass — an intentional Save must not be
  // blocked by the unsaved-changes guard (nor its post-save redirect).
  let formEl = $state<HTMLFormElement | null>(null)
  guardNavigation(() => formEl)

  const adminT = $derived(getAdminT($page.data))
  const form = $derived($page.form)
  const errors = $derived(
    (form as { fieldErrors?: Record<string, string[]> } | null)?.fieldErrors ?? {}
  )

  const nonDefaultLocales = $derived(LOCALES.filter(locale => locale !== DEFAULT_LOCALE))
  const localeNames = $derived(
    Object.fromEntries(LOCALES.map(locale => [locale, LOCALE_CONFIG[locale].name]))
  )

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
</script>

<AdminEditorPage
  title={t('common.edit')}
  backHref={ADMIN_ROUTES.portfolios}
  csrfToken={$page.data.csrfToken}
  bind:formEl={formEl}
  saveDisabled={!isDirty}
>
  {#snippet actions()}
    <!-- The real content-edit path is the primary action of this settings
         page (PM2 parity split: metadata here, items on the content route). -->
    <CtaButton variant="primary" size="sm" href={ADMIN_ROUTES.portfolioItems(p.id)}>
      <IconPencil class="size-4" />
      {adminT['admin.editContent'] ?? t('admin.editContent')}
    </CtaButton>
  {/snippet}
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
        error={errors.type?.[0] ? t(errors.type[0], 'Portfolio type change not supported') : ''}
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

  <AdminFormSection title={adminT['admin.localizedText'] ?? t('admin.localizedText')}>
    <AdminLocaleTextFields
      locales={nonDefaultLocales}
      localeNames={localeNames}
      fields={[
        { key: 'name', label: adminT['admin.name'] ?? t('admin.name') },
        {
          key: 'description',
          label: adminT['admin.description'] ?? t('admin.description'),
          type: 'textarea',
          rows: 4
        }
      ]}
      initialValues={data.translations ?? {}}
    />
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
