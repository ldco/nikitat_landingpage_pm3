<script lang="ts">
  /**
   * Admin Blog Post Edit — Full post form with per-locale translations (upsert)
   */
  import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
  import { t } from '$lib/stores/content.svelte'
  import { page } from '$app/stores'
  import { getAdminT } from '$lib/utils/admin-translations'
  import { LOCALE_CONFIG } from '$lib/config/site'
  import { createFormDirty } from '$lib/utils/form-dirty.svelte'
  import AdminEditorPage from '$lib/components/molecules/AdminEditorPage.svelte'
  import FormField from '$lib/components/atoms/FormField.svelte'
  import AdminFormSection from '$lib/components/molecules/AdminFormSection.svelte'
  import FileUpload from '$lib/components/molecules/FileUpload.svelte'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  const p = $derived(data.post)
  const locales = $derived(data.locales ?? [])
  const categories = $derived(data.categories ?? [])
  const categoryOptions = $derived([
    { value: '', label: t('common.none') },
    ...categories.map(c => ({ value: String(c.id), label: c.slug }))
  ])
  const postTranslations = $derived(data.translations ?? [])

  const adminT = $derived(getAdminT($page.data))
  const form = $derived($page.form)
  const errors = $derived((form as { fieldErrors?: Record<string, string[]> } | null)?.fieldErrors ?? {})

  let slug = $state(p.slug)
  let categoryId = $state(p.categoryId ? String(p.categoryId) : '')
  let coverImageUrl = $state(p.coverImageUrl ?? '')
  let coverImageAlt = $state(p.coverImageAlt ?? '')
  let published = $state(p.published === true)
  let readingTimeMinutes = $state(p.readingTimeMinutes ? String(p.readingTimeMinutes) : '')

  const translations = $state<Record<string, { title: string; excerpt: string; content: string }>>({})
  // Per-locale explicit-removal intent (the `remove_<loc>` checkboxes below).
  // Part of the dirty source so a removal-only edit enables Save — toggling
  // the checkbox must count as a change even when no field text is edited.
  const removals = $state<Record<string, boolean>>({})
  {
    for (const loc of locales) {
      const row = postTranslations.find(r => r.locale === loc)
      translations[loc] = {
        title: row?.title ?? '',
        excerpt: row?.excerpt ?? '',
        content: row?.content ?? ''
      }
      removals[loc] = false
    }
  }

  const { isDirty, markClean, guardNavigation } = createFormDirty(() => ({
    slug,
    categoryId,
    coverImageUrl,
    coverImageAlt,
    published,
    readingTimeMinutes,
    translations,
    removals
  }))
  markClean()
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
  backHref={ADMIN_ROUTES.blog}
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
        name="categoryId"
        type="select"
        label={adminT['admin.category'] ?? t('admin.category')}
        options={categoryOptions}
        bind:value={categoryId}
      />
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-pm-text">{adminT['admin.coverImageUrl'] ?? t('admin.coverImageUrl')}</label>
        <FileUpload
          bind:value={coverImageUrl}
          dropzoneLabel={adminT['admin.dropzoneLabel'] ?? t('admin.dropzoneLabel')}
          uploadingLabel={t('common.uploading')}
          tooLargeLabel={adminT['admin.fileTooLarge'] ?? t('admin.fileTooLarge')}
          uploadFailedLabel={adminT['admin.uploadFailed'] ?? t('admin.uploadFailed')}
          removeLabel={t('common.remove')}
        />
      </div>
      <FormField
        name="coverImageAlt"
        label={adminT['admin.coverImageAlt'] ?? t('admin.coverImageAlt')}
        bind:value={coverImageAlt}
      />
      <FormField
        name="readingTimeMinutes"
        type="number"
        label={adminT['admin.readTime'] ?? t('admin.readTime')}
        bind:value={readingTimeMinutes}
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
          oninput={(e) => { translations[loc] = translations[loc] ?? { title: '', excerpt: '', content: '' }; translations[loc].title = (e.currentTarget as HTMLInputElement).value }}
          error={errors[`title_${loc}`]?.[0] ?? ''}
        />
        <FormField
          name={`excerpt_${loc}`}
          type="textarea"
          label={adminT['admin.excerpt'] ?? t('admin.excerpt')}
          value={translations[loc]?.excerpt ?? ''}
          oninput={(e) => { translations[loc] = translations[loc] ?? { title: '', excerpt: '', content: '' }; translations[loc].excerpt = (e.currentTarget as HTMLTextAreaElement).value }}
        />
        <FormField
          name={`content_${loc}`}
          type="textarea"
          label={adminT['admin.content'] ?? t('admin.content')}
          value={translations[loc]?.content ?? ''}
          oninput={(e) => { translations[loc] = translations[loc] ?? { title: '', excerpt: '', content: '' }; translations[loc].content = (e.currentTarget as HTMLTextAreaElement).value }}
        />
        <label class="flex items-center gap-2 text-sm text-pm-text-muted">
          <input type="checkbox" name={`remove_${loc}`} value="on" bind:checked={removals[loc]} />
          {adminT['admin.removeTranslation'] ?? t('admin.removeTranslation')}
        </label>
      </div>
    </AdminFormSection>
  {/each}
</AdminEditorPage>
