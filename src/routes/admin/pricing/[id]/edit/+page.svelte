<script lang="ts">
  /**
   * Admin Pricing Tier Edit — Full form with per-locale overrides and features list (upsert)
   */
  import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
  import { t } from '$lib/stores/content.svelte'
  import { page } from '$app/stores'
  import { getAdminT } from '$lib/utils/admin-translations'
  import { LOCALE_CONFIG } from '$lib/config/site'
  import { createFormDirty } from '$lib/utils/form-dirty.svelte'
  import PageHeader from '$lib/components/atoms/PageHeader.svelte'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
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

  let slug = $state(p.slug)
  let name = $state(p.name)
  let description = $state(p.description ?? '')
  let price = $state(p.price !== null ? String(p.price) : '')
  let currency = $state(p.currency ?? '')
  let period = $state(p.period ?? 'month')
  let featured = $state(p.featured === true)
  let ctaText = $state(p.ctaText ?? '')
  let ctaUrl = $state(p.ctaUrl ?? '/contact')
  let order = $state(p.order !== null ? String(p.order) : '0')
  let published = $state(p.published === true)
  let features = $state(tierFeatures.map(f => f.text).join(', '))
  const currencies = $state(['USD', 'EUR', 'RUB'])

  const translations = $state<Record<string, { name: string; description: string; ctaText: string }>>({})
  const featuresByLocale = $state<Record<string, string>>({})
  {
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
  }

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
  markClean()
  guardNavigation()

  function localeName(loc: string): string {
    return LOCALE_CONFIG[loc as keyof typeof LOCALE_CONFIG]?.name ?? loc
  }
</script>

<PageHeader title={t('common.edit')}>
  {#snippet actions()}
    <a href={ADMIN_ROUTES.pricing} class="text-pm-text-muted hover:text-pm-brand text-sm">&larr; {t('common.back')}</a>
  {/snippet}
</PageHeader>

<form method="POST" class="flex flex-col gap-6">
  <input type="hidden" name="_csrf" value={$page.data.csrfToken} />

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
      <div class="flex flex-col gap-1">
        <label for="field-currency" class="text-sm font-medium text-pm-text">{adminT['admin.currency'] ?? t('admin.currency')}</label>
        <select id="field-currency" name="currency" bind:value={currency}
          class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring">
          {#each currencies as code (code)}
            <option value={code}>{code}</option>
          {/each}
        </select>
      </div>
      <div class="flex flex-col gap-1">
        <label for="field-period" class="text-sm font-medium text-pm-text">{adminT['admin.period'] ?? t('admin.period')}</label>
        <select id="field-period" name="period" bind:value={period}
          class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring">
          <option value="month">{adminT['admin.periodMonth'] ?? t('admin.periodMonth')}</option>
          <option value="year">{adminT['admin.periodYear'] ?? t('admin.periodYear')}</option>
          <option value="one-time">{adminT['admin.periodOneTime'] ?? t('admin.periodOneTime')}</option>
        </select>
      </div>
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

  <div class="flex justify-end gap-3">
    <CtaButton variant="ghost" href={ADMIN_ROUTES.pricing}>{t('common.cancel')}</CtaButton>
    <CtaButton type="submit" variant="primary" disabled={!isDirty}>{t('common.save')}</CtaButton>
  </div>
</form>
