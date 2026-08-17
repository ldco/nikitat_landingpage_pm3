<script lang="ts">
  /**
   * PortfolioItemEditor — Admin modal for creating/editing a portfolio item
   *
   * Owns the item form state (base fields + per-type metadata) and renders
   * the AdminModal with the common fields and the type-specific field editor
   * (Website/Branding/Brandbook/CaseStudy). Metadata hydration/serialization
   * delegate to the shared adapter (`portfolio-metadata-form`), so the state
   * this modal edits is exactly what the page-action and JSON-API validators
   * accept. Submission happens through the AdminModal's SvelteKit form action.
   *
   * @props {boolean} open — modal visibility
   * @props {PortfolioItem|null} editingItem — item being edited (null = create)
   * @props {string} portfolioType — portfolio type driving the metadata fields
   * @props {() => void} onClose — close callback
   *
   * @example
   * <PortfolioItemEditor open={modalOpen} onClose={() => (modalOpen = false)} portfolioType="branding" />
   */
  import { page } from '$app/stores'
  import { t } from '$lib/stores/content.svelte'
  import { getAdminT } from '$lib/utils/admin-translations'
  import { LOCALES, DEFAULT_LOCALE, LOCALE_CONFIG } from '$lib/config/site'
  import AdminModal from '$lib/components/molecules/AdminModal.svelte'
  import AdminFormSection from '$lib/components/molecules/AdminFormSection.svelte'
  import AdminLocaleTextFields from '$lib/components/molecules/AdminLocaleTextFields.svelte'
  import FileUpload from '$lib/components/molecules/FileUpload.svelte'
  import FormField from '$lib/components/atoms/FormField.svelte'
  import WebsiteFields from '$lib/components/admin/portfolio/WebsiteFields.svelte'
  import BrandingFields from '$lib/components/admin/portfolio/BrandingFields.svelte'
  import BrandbookFields from '$lib/components/admin/portfolio/BrandbookFields.svelte'
  import CaseStudyFields from '$lib/components/admin/portfolio/CaseStudyFields.svelte'
  import { API_ROUTES } from '$lib/utils/api-paths'
  import {
    PORTFOLIO_ITEM_TYPE_OPTIONS,
    portfolioItemTypesFor,
    emptyItemFormMetadata,
    hydrateItemMetadata,
    serializeItemMetadata,
    type PortfolioItem,
    type PortfolioItemFormMetadata,
    type PortfolioItemTypeValue
  } from '$lib/portfolio-metadata-form'
  import { parseItemMetadata } from '$lib/portfolio-metadata'

  let {
    open = false,
    editingItem = null,
    portfolioType = 'branding',
    itemTranslations = {},
    onClose
  }: {
    open: boolean
    editingItem?: PortfolioItem | null
    portfolioType?: string
    itemTranslations?: Record<number, Record<string, Record<string, string>>>
    onClose: () => void
  } = $props()

  const adminT = $derived(getAdminT($page.data))

  /**
   * Hydrate the editable per-type fields from a stored item. When the stored
   * metadata does not parse under the CURRENT portfolio type (a legacy row
   * that predates a type change), fall back to the raw JSON so recognizable
   * fields (tags, urls, …) surface into the form instead of being silently
   * blanked — a save then keeps them instead of wiping them.
   */
  function hydrateItemForm(item: PortfolioItem, portfolioType: string): PortfolioItemFormMetadata {
    const parsed = parseItemMetadata(item.metadata ?? null, portfolioType)
    if (Object.keys(parsed).length > 0 || !item.metadata) {
      return hydrateItemMetadata(parsed)
    }
    let raw: unknown
    try {
      raw = JSON.parse(item.metadata)
    } catch {
      return emptyItemFormMetadata()
    }
    if (typeof raw !== 'object' || raw === null) return emptyItemFormMetadata()
    return hydrateItemMetadata(raw as Record<string, unknown>)
  }

  // ── Form state ───────────────────────────────────────────────────────────
  // The CREATE path starts with the first item type the parent portfolio can
  // render (e.g. case_study portfolios start as `case_study`) so the modal
  // never submits a server-invalid default. The legacy EDIT path keeps the
  // row's own type.
  let formItemType = $state<PortfolioItemTypeValue>(
    portfolioItemTypesFor(portfolioType)[0] ?? 'image'
  )
  let formMediaUrl = $state('')
  let formThumbnailUrl = $state('')
  let formCaption = $state('')
  let formTitle = $state('')
  let formDescription = $state('')
  let formContent = $state('')
  let formPublished = $state(true)
  let formMetadata = $state<PortfolioItemFormMetadata>(emptyItemFormMetadata())

  // Hydrate/blank the form whenever the target item changes.
  $effect(() => {
    const item = editingItem
    formItemType = item?.itemType ?? portfolioItemTypesFor(portfolioType)[0] ?? 'image'
    formMediaUrl = item?.mediaUrl ?? ''
    formThumbnailUrl = item?.thumbnailUrl ?? ''
    formCaption = item?.caption ?? ''
    formTitle = item?.title ?? ''
    formDescription = item?.description ?? ''
    formContent = item?.content ?? ''
    formPublished = item?.published ?? true
    formMetadata = item ? hydrateItemForm(item, portfolioType) : emptyItemFormMetadata()
  })

  const isWebsite = $derived(portfolioType === 'website')
  const isBranding = $derived(portfolioType === 'branding')
  const isBrandbook = $derived(portfolioType === 'brandbook')
  const isCaseStudy = $derived(portfolioType === 'case_study')

  // Item-type options are derived from the parent portfolio type so the admin
  // never offers combinations the public viewers cannot render. Legacy rows
  // holding an item type outside the matrix stay visible (labelled raw) so
  // they can be inspected/fixed instead of rendering a blank select.
  const itemTypeOptions = $derived.by(() => {
    const allowed = portfolioItemTypesFor(portfolioType)
    const options = PORTFOLIO_ITEM_TYPE_OPTIONS
      .filter(ty => allowed.includes(ty.value))
      .map(ty => ({ value: ty.value, label: adminT[ty.key] ?? ty.value }))
    if (formItemType && !options.some(o => o.value === formItemType)) {
      options.push({ value: formItemType, label: formItemType })
    }
    return options
  })

  const metadataJson = $derived(serializeItemMetadata(formMetadata, portfolioType))

  const form = $derived($page.form)
  const errors = $derived(
    (form as { fieldErrors?: Record<string, string[]> } | null)?.fieldErrors ?? {}
  )

  // ── Per-locale text overrides (other languages) ──────────────────────────
  const nonDefaultLocales = $derived(LOCALES.filter(locale => locale !== DEFAULT_LOCALE))
  const localeNames = $derived(
    Object.fromEntries(LOCALES.map(locale => [locale, LOCALE_CONFIG[locale].name]))
  )
  const localizedValues = $derived(
    editingItem ? (itemTranslations[editingItem.id] ?? {}) : {}
  )
  // The localized content field mirrors the base form's conditionality: only
  // the body-rendering portfolio types expose it. `category` is always
  // rendered — the hydration localizes it and the viewers display it.
  const localizedBodyField: Array<{ key: string; label: string; type: 'textarea'; rows: number }> =
    isWebsite || isBranding || isCaseStudy
      ? [{
          key: 'content',
          label: adminT['admin.portfolioContent'] ?? t('admin.portfolioContent'),
          type: 'textarea',
          rows: 8
        }]
      : []
  const localizedFields = $derived<Array<{ key: string; label: string; type?: 'input' | 'textarea'; rows?: number }>>([
    { key: 'title', label: adminT['admin.itemTitle'] ?? t('admin.itemTitle') },
    {
      key: 'description',
      label: adminT['admin.description'] ?? t('admin.description'),
      type: 'textarea',
      rows: 3
    },
    { key: 'category', label: adminT['admin.category'] ?? t('admin.category') },
    ...localizedBodyField
  ])
</script>

<AdminModal
  open={open}
  title={editingItem ? adminT['admin.editItem'] ?? t('admin.editItem') : adminT['admin.addItem'] ?? t('admin.addItem')}
  formAction={editingItem ? '?/update' : '?/create'}
  cancelLabel={t('common.cancel')}
  submitLabel={t('common.save')}
  onclose={onClose}
>
  <input type="hidden" name="_csrf" value={$page.data.csrfToken} />
  {#if editingItem}
    <input type="hidden" name="id" value={editingItem.id} />
  {/if}
  <input type="hidden" name="thumbnailUrl" value={formThumbnailUrl} />
  <input type="hidden" name="metadata" value={metadataJson} />

  <div class="flex flex-col gap-4">
    <FormField
      name="itemType"
      type="select"
      label={adminT['admin.mediaType'] ?? t('admin.mediaType')}
      options={itemTypeOptions}
      bind:value={formItemType}
    />

    <FileUpload
      bind:value={formMediaUrl}
      bind:thumbnailUrl={formThumbnailUrl}
      accept={formItemType === 'video' ? 'video/*' : 'image/*'}
      endpoint={formItemType === 'video' ? API_ROUTES.upload.video : API_ROUTES.upload.image}
      dropzoneLabel={adminT['admin.dropzoneLabel'] ?? t('admin.dropzoneLabel')}
      uploadingLabel={t('common.uploading')}
      tooLargeLabel={adminT['admin.fileTooLarge'] ?? t('admin.fileTooLarge')}
      uploadFailedLabel={adminT['admin.uploadFailed'] ?? t('admin.uploadFailed')}
      removeLabel={t('common.remove')}
    />

    <AdminFormSection>
      <div class="flex flex-col gap-4">
        <FormField
          name="mediaUrl"
          label={adminT['admin.externalUrl'] ?? t('admin.externalUrl')}
          bind:value={formMediaUrl}
          placeholder="https://..."
        />
        <FormField
          name="title"
          label={adminT['admin.itemTitle'] ?? t('admin.itemTitle')}
          bind:value={formTitle}
        />
        <FormField
          name="caption"
          label={adminT['admin.caption'] ?? t('admin.caption')}
          bind:value={formCaption}
        />
        <FormField
          name="description"
          type="textarea"
          rows={3}
          label={adminT['admin.description'] ?? t('admin.description')}
          bind:value={formDescription}
        />
        {#if isWebsite}
          <WebsiteFields
            bind:liveUrl={formMetadata.liveUrl}
            bind:technologies={formMetadata.technologies}
            bind:screenshots={formMetadata.screenshots}
            bind:content={formContent}
          />
        {/if}
        {#if isBranding}
          <BrandingFields
            bind:clientUrl={formMetadata.clientUrl}
            bind:tags={formMetadata.tags}
            bind:sections={formMetadata.sections}
            bind:gallery={formMetadata.gallery}
            bind:content={formContent}
          />
        {/if}
        {#if isCaseStudy}
          <CaseStudyFields bind:tags={formMetadata.tags} bind:content={formContent} />
        {/if}
        {#if isBrandbook}
          <BrandbookFields bind:pdfUrl={formMetadata.pdfUrl} bind:pages={formMetadata.pages} />
        {/if}
        <FormField
          type="checkbox"
          name="published"
          label={adminT['admin.published'] ?? t('admin.published')}
          bind:value={formPublished}
        />
      </div>
    </AdminFormSection>

    <AdminFormSection title={adminT['admin.localizedText'] ?? t('admin.localizedText')}>
      <AdminLocaleTextFields
        locales={nonDefaultLocales}
        localeNames={localeNames}
        fields={localizedFields}
        initialValues={localizedValues}
      />
    </AdminFormSection>

    {#if errors.itemType?.[0] || errors.id?.[0] || errors.metadata?.[0]}
      <p
        class="text-sm text-pm-danger bg-pm-danger-bg border border-pm-danger rounded-md px-3 py-2"
        role="alert"
      >
        {t(errors.itemType?.[0] ?? errors.id?.[0] ?? errors.metadata?.[0] ?? '')}
      </p>
    {/if}
  </div>
</AdminModal>
