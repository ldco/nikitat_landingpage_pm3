<script lang="ts">
  /**
   * Admin Blog Post Create — Full post form with per-locale translations
   */
  import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
  import { t } from '$lib/stores/content.svelte'
  import { page } from '$app/stores'
  import { getAdminT } from '$lib/utils/admin-translations'
  import { LOCALE_CONFIG } from '$lib/config/site'
  import AdminEditorPage from '$lib/components/molecules/AdminEditorPage.svelte'
  import FormField from '$lib/components/atoms/FormField.svelte'
  import AdminFormSection from '$lib/components/molecules/AdminFormSection.svelte'
  import FileUpload from '$lib/components/molecules/FileUpload.svelte'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  const adminT = $derived(getAdminT($page.data))
  const form = $derived($page.form)
  const errors = $derived((form as { fieldErrors?: Record<string, string[]> } | null)?.fieldErrors ?? {})
  const locales = $derived(data.locales ?? [])
  const categories = $derived(data.categories ?? [])
  const categoryOptions = $derived([
    { value: '', label: 'common.none' },
    ...categories.map(c => ({ value: String(c.id), label: c.slug }))
  ])

  let slug = $state('')
  let categoryId = $state('')
  let coverImageUrl = $state('')
  let coverImageAlt = $state('')
  let published = $state(false)
  let readingTimeMinutes = $state('')
  const translations = $state<Record<string, { title: string; excerpt: string; content: string }>>({})
  $effect.pre(() => {
    for (const loc of locales) {
      translations[loc] = { title: '', excerpt: '', content: '' }
    }
  })

  function localeName(loc: string): string {
    return LOCALE_CONFIG[loc as keyof typeof LOCALE_CONFIG]?.name ?? loc
  }
</script>

<AdminEditorPage
  title={t('common.create')}
  backHref={ADMIN_ROUTES.blog}
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
        name="categoryId"
        type="select"
        label={adminT['admin.category'] ?? t('admin.category')}
        options={categoryOptions}
        bind:value={categoryId}
      />
      <div class="flex flex-col gap-2">
        <span class="text-sm font-medium text-pm-text">{adminT['admin.coverImageUrl'] ?? t('admin.coverImageUrl')}</span>
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
      </div>
    </AdminFormSection>
  {/each}
</AdminEditorPage>
