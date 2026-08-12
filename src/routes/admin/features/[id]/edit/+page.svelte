<script lang="ts">
  /**
   * Admin Feature Edit — Full form with per-locale translations (upsert)
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
  const featureTranslations = $derived(data.translations ?? [])

  const adminT = $derived(getAdminT($page.data))
  const form = $derived($page.form)
  const errors = $derived((form as { fieldErrors?: Record<string, string[]> } | null)?.fieldErrors ?? {})

  let slug = $state(p.slug)
  let imageUrl = $state(p.imageUrl ?? '')
  let hoverImageUrl = $state(p.hoverImageUrl ?? '')
  let category = $state(p.category ?? '')
  let order = $state(p.order !== null ? String(p.order) : '0')
  let published = $state(p.published === true)

  const translations = $state<Record<string, { title: string; description: string }>>({})
  {
    for (const loc of locales) {
      const row = featureTranslations.find(r => r.locale === loc)
      translations[loc] = {
        title: row?.title ?? '',
        description: row?.description ?? ''
      }
    }
  }

  const { isDirty, markClean, guardNavigation } = createFormDirty(() => ({ slug: slug }))
  markClean()
  guardNavigation()

  function localeName(loc: string): string {
    return LOCALE_CONFIG[loc as keyof typeof LOCALE_CONFIG]?.name ?? loc
  }
</script>

<PageHeader title={t('common.edit')}>
  {#snippet actions()}
    <a href={ADMIN_ROUTES.features} class="text-pm-text-muted hover:text-pm-brand text-sm">&larr; {t('common.back')}</a>
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
        error={errors.slug?.[0] ?? ''}
        required
      />
      <FormField
        name="imageUrl"
        label={adminT['admin.imageUrl'] ?? t('admin.imageUrl')}
        bind:value={imageUrl}
        placeholder="https://..."
      />
      <FormField
        name="hoverImageUrl"
        label={adminT['admin.hoverImageUrl'] ?? t('admin.hoverImageUrl')}
        bind:value={hoverImageUrl}
        placeholder="https://..."
      />
      <FormField
        name="category"
        label={adminT['admin.category'] ?? t('admin.category')}
        bind:value={category}
      />
      <FormField
        name="order"
        type="number"
        label={adminT['admin.order'] ?? t('admin.order')}
        bind:value={order}
        error={errors.order?.[0] ?? ''}
      />
      <FormField
        name="published"
        type="checkbox"
        label={adminT['admin.published'] ?? t('admin.published')}
        bind:value={published}
      />
    </div>
  </AdminFormSection>

  {#each locales as loc (loc)}
    <AdminFormSection title={localeName(loc) + ' (' + loc + ')'}>
      <div class="flex flex-col gap-4">
        <FormField
          name={`title_${loc}`}
          label={adminT['admin.title'] ?? t('admin.title')}
          value={translations[loc]?.title ?? ''}
          oninput={(e) => { translations[loc] = translations[loc] ?? { title: '', description: '' }; translations[loc].title = (e.currentTarget as HTMLInputElement).value }}
          error={errors[`title_${loc}`]?.[0] ?? ''}
        />
        <FormField
          name={`description_${loc}`}
          type="textarea"
          label={adminT['admin.description'] ?? t('admin.description')}
          value={translations[loc]?.description ?? ''}
          oninput={(e) => { translations[loc] = translations[loc] ?? { title: '', description: '' }; translations[loc].description = (e.currentTarget as HTMLTextAreaElement).value }}
        />
      </div>
    </AdminFormSection>
  {/each}

  <div class="flex justify-end gap-3">
    <CtaButton variant="ghost" href={ADMIN_ROUTES.features}>{t('common.cancel')}</CtaButton>
    <CtaButton type="submit" variant="primary" disabled={!isDirty}>{t('common.save')}</CtaButton>
  </div>
</form>
