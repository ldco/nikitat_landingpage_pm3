<script lang="ts">
  /**
   * Admin Pricing Tier Create — Full form with per-locale overrides and features list
   */
  import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
  import { t } from '$lib/stores/content.svelte'
  import { page } from '$app/stores'
  import { getAdminT } from '$lib/utils/admin-translations'
  import { LOCALE_CONFIG } from '$lib/config/site'
  import AdminEditorPage from '$lib/components/molecules/AdminEditorPage.svelte'
  import FormField from '$lib/components/atoms/FormField.svelte'
  import AdminFormSection from '$lib/components/molecules/AdminFormSection.svelte'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  const adminT = $derived(getAdminT($page.data))
  const form = $derived($page.form)
  const errors = $derived((form as { fieldErrors?: Record<string, string[]> } | null)?.fieldErrors ?? {})
  const locales = $derived(data.locales ?? [])

  let slug = $state('')
  let name = $state('')
  let description = $state('')
  let price = $state('')
  let currency = $state('USD')
  let period = $state('month')
  let featured = $state(false)
  let ctaText = $state('')
  let ctaUrl = $state('/contact')
  let order = $state('0')
  let published = $state(true)
  let features = $state('')
  const currencies = $state(['USD', 'EUR', 'RUB'])
  const currencyOptions = $derived(currencies.map(code => ({ value: code, label: code })))
  const periodOptions = $derived([
    { value: 'month', label: adminT['admin.periodMonth'] ?? t('admin.periodMonth') },
    { value: 'year', label: adminT['admin.periodYear'] ?? t('admin.periodYear') },
    { value: 'one-time', label: adminT['admin.periodOneTime'] ?? t('admin.periodOneTime') }
  ])
  const translations = $state<Record<string, { name: string; description: string; ctaText: string }>>({})
  {
    for (const loc of locales) {
      translations[loc] = { name: '', description: '', ctaText: '' }
    }
  }

  const featuresByLocale = $state<Record<string, string>>({})
  {
    for (const loc of locales) {
      featuresByLocale[loc] = ''
    }
  }

  function localeName(loc: string): string {
    return LOCALE_CONFIG[loc as keyof typeof LOCALE_CONFIG]?.name ?? loc
  }
</script>

<AdminEditorPage
  title={t('common.create')}
  backHref={ADMIN_ROUTES.pricing}
  csrfToken={$page.data.csrfToken}
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
