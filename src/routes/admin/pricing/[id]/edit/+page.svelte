<script lang="ts">
  /**
   * Admin Pricing Tier Edit — Full form with per-locale overrides and features list (upsert)
   */
  import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
  import { t } from '$lib/stores/content.svelte'
  import { page } from '$app/stores'
  import { getAdminT } from '$lib/utils/admin-translations'
  import { LOCALE_CONFIG } from '$lib/config/site'
  import {
    PRICING_CURRENCIES,
    PRICING_DEFAULT_PERIOD,
    PRICING_DEFAULT_CTA_URL
  } from '$lib/pricing-constants'
  import { createFormDirty } from '$lib/utils/form-dirty.svelte'
  import AdminEditorPage from '$lib/components/molecules/AdminEditorPage.svelte'
  import FormField from '$lib/components/atoms/FormField.svelte'
  import AdminFormSection from '$lib/components/molecules/AdminFormSection.svelte'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  const p = $derived(data.item)
  const locales = $derived(data.locales ?? [])
  const tierTranslations = $derived(data.translations ?? [])
  const tierFeatures = $derived(data.features ?? [])
  const tierFeatureTranslations = $derived(data.featureTranslations ?? [])

  const adminT = $derived(getAdminT($page.data))
  const form = $derived($page.form)
  const errors = $derived((form as { fieldErrors?: Record<string, string[]> } | null)?.fieldErrors ?? {})

  let slug = $state('')
  let name = $state('')
  let description = $state('')
  let price = $state('')
  let currency = $state('')
  let period = $state(PRICING_DEFAULT_PERIOD)
  let featured = $state(false)
  let ctaText = $state('')
  let ctaUrl = $state(PRICING_DEFAULT_CTA_URL)
  let order = $state('0')
  let published = $state(false)
  let features = $state('')
  const currencies = $state([...PRICING_CURRENCIES])
  const currencyOptions = $derived(currencies.map(code => ({ value: code, label: code })))
  const periodOptions = $derived([
    { value: 'month', label: 'admin.periodMonth' },
    { value: 'year', label: 'admin.periodYear' },
    { value: 'one-time', label: 'admin.periodOneTime' }
  ])

  const translations = $state<Record<string, { name: string; description: string; ctaText: string }>>({})
  const featuresByLocale = $state<Record<string, string>>({})

  const { isDirty, markClean, guardNavigation } = createFormDirty(() => ({
    slug,
    name,
    description,
    price,
    currency,
    period,
    featured,
    ctaText,
    ctaUrl,
    order,
    published,
    features,
    featuresByLocale,
    translations
  }))

  // Seed the editable form from the server-loaded record. Runs before the
  // first paint (no blank flash) and re-seeds whenever the record changes, so
  // client-side navigation between two records can never show stale values.
  $effect.pre(() => {
    slug = p.slug
    name = p.name
    description = p.description ?? ''
    price = p.price !== null ? String(p.price) : ''
    currency = p.currency ?? ''
    period = p.period ?? 'month'
    featured = p.featured === true
    ctaText = p.ctaText ?? ''
    ctaUrl = p.ctaUrl ?? '/contact'
    order = p.order !== null ? String(p.order) : '0'
    published = p.published === true
    features = tierFeatures.map(f => f.text).join(', ')
    for (const loc of locales) {
      const row = tierTranslations.find(r => r.locale === loc)
      translations[loc] = {
        name: row?.name ?? '',
        description: row?.description ?? '',
        ctaText: row?.ctaText ?? ''
      }
      // Prefill each locale's feature list with its translated texts in
      // feature order; fall back to the base text when no translation exists.
      const localized = tierFeatures.map((f, index) => {
        const ft = tierFeatureTranslations.find(t => t.featureId === f.id && t.locale === loc)
        return ft?.text ?? f.text
      }).filter(Boolean)
      featuresByLocale[loc] = localized.join(', ')
    }
    markClean()
  })
  // The form element arms the submit bypass — an intentional Save must not be
  // blocked by the unsaved-changes guard (nor its post-save redirect).
  let formEl = $state<HTMLFormElement | null>(null)
  guardNavigation(() => formEl)

  function localeName(loc: string): string {
    return LOCALE_CONFIG[loc as keyof typeof LOCALE_CONFIG]?.name ?? loc
  }
</script>

<AdminEditorPage
  title={t('common.edit')}
  backHref={ADMIN_ROUTES.pricing}
  csrfToken={$page.data.csrfToken}
  bind:formEl={formEl}
  saveDisabled={!isDirty}
>
  <AdminFormSection title={adminT['admin.basicInfo'] ?? t('admin.basicInfo')}>
    <div class="grid gap-4 grid-cols-[var(--grid-admin-form)]">
      <FormField
        name="slug"
        label={adminT['admin.slug'] ?? t('admin.slug')}
        bind:value={slug}
        error={t(errors.slug?.[0] ?? '')}
        required
      />
      <FormField
        name="name"
        label={adminT['admin.name'] ?? t('admin.name')}
        bind:value={name}
        error={t(errors.name?.[0] ?? '')}
        required
      />
      <FormField
        name="description"
        type="textarea"
        label={adminT['admin.description'] ?? t('admin.description')}
        bind:value={description}
      />
      <FormField
        name="price"
        type="number"
        label={adminT['admin.price'] ?? t('admin.price')}
        bind:value={price}
        error={t(errors.price?.[0] ?? '')}
      />
      <FormField
        name="currency"
        type="select"
        label={adminT['admin.currency'] ?? t('admin.currency')}
        options={currencyOptions}
        bind:value={currency}
      />
      <FormField
        name="period"
        type="select"
        label={adminT['admin.period'] ?? t('admin.period')}
        options={periodOptions}
        bind:value={period}
      />
      <FormField
        name="featured"
        type="checkbox"
        label={adminT['admin.featured'] ?? t('admin.featured')}
        bind:value={featured}
      />
      <FormField
        name="ctaText"
        label={adminT['admin.ctaText'] ?? t('admin.ctaText')}
        bind:value={ctaText}
      />
      <FormField
        name="ctaUrl"
        label={adminT['admin.ctaUrl'] ?? t('admin.ctaUrl')}
        bind:value={ctaUrl}
        placeholder="/contact"
      />
      <FormField
        name="order"
        type="number"
        label={adminT['admin.order'] ?? t('admin.order')}
        bind:value={order}
        error={t(errors.order?.[0] ?? '')}
      />
      <FormField
        name="published"
        type="checkbox"
        label={adminT['admin.published'] ?? t('admin.published')}
        bind:value={published}
      />
      <FormField
        name="features"
        type="textarea"
        label={adminT['admin.features'] ?? t('admin.features')}
        bind:value={features}
        error={t(errors.features?.[0] ?? '')}
      />
    </div>
  </AdminFormSection>

  {#each locales as loc (loc)}
    <AdminFormSection title={localeName(loc) + ' (' + loc + ')'}>
      <div class="flex flex-col gap-4">
        <FormField
          name={`name_${loc}`}
          label={adminT['admin.name'] ?? t('admin.name')}
          value={translations[loc]?.name ?? ''}
          oninput={(e) => { translations[loc] = translations[loc] ?? { name: '', description: '', ctaText: '' }; translations[loc].name = (e.currentTarget as HTMLInputElement).value }}
          error={errors[`name_${loc}`]?.[0] ?? ''}
        />
        <FormField
          name={`description_${loc}`}
          type="textarea"
          label={adminT['admin.description'] ?? t('admin.description')}
          value={translations[loc]?.description ?? ''}
          oninput={(e) => { translations[loc] = translations[loc] ?? { name: '', description: '', ctaText: '' }; translations[loc].description = (e.currentTarget as HTMLTextAreaElement).value }}
        />
        <FormField
          name={`ctaText_${loc}`}
          label={adminT['admin.ctaText'] ?? t('admin.ctaText')}
          value={translations[loc]?.ctaText ?? ''}
          oninput={(e) => { translations[loc] = translations[loc] ?? { name: '', description: '', ctaText: '' }; translations[loc].ctaText = (e.currentTarget as HTMLInputElement).value }}
        />
        <FormField
          name={`features_${loc}`}
          type="textarea"
          label={adminT['admin.features'] ?? t('admin.features')}
          value={featuresByLocale[loc] ?? ''}
          oninput={(e) => { featuresByLocale[loc] = (e.currentTarget as HTMLTextAreaElement).value }}
        />
      </div>
    </AdminFormSection>
  {/each}
</AdminEditorPage>
