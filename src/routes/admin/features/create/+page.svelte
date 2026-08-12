<script lang="ts">
  /**
   * Admin Feature Create — Full form with per-locale translations
   */
  import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
  import { t } from '$lib/stores/content.svelte'
  import { page } from '$app/stores'
  import { getAdminT } from '$lib/utils/admin-translations'
  import { LOCALE_CONFIG } from '$lib/config/site'
  import PageHeader from '$lib/components/atoms/PageHeader.svelte'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import FormField from '$lib/components/atoms/FormField.svelte'
  import AdminFormSection from '$lib/components/molecules/AdminFormSection.svelte'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  const adminT = $derived(getAdminT($page.data))
  const form = $derived($page.form)
  const errors = $derived((form as { fieldErrors?: Record<string, string[]> } | null)?.fieldErrors ?? {})
  const locales = $derived(data.locales ?? [])

  let slug = $state('')
  let imageUrl = $state('')
  let hoverImageUrl = $state('')
  let category = $state('')
  let order = $state('0')
  let published = $state(true)
  const translations = $state<Record<string, { title: string; description: string }>>({})
  {
    for (const loc of locales) {
      translations[loc] = { title: '', description: '' }
    }
  }

  function localeName(loc: string): string {
    return LOCALE_CONFIG[loc as keyof typeof LOCALE_CONFIG]?.name ?? loc
  }
</script>

<PageHeader title={t('common.create')}>
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
        error={t(errors.slug?.[0] ?? '')}
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
        error={t(errors.order?.[0] ?? '')}
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
    <CtaButton type="submit" variant="primary">{t('common.save')}</CtaButton>
  </div>
</form>
