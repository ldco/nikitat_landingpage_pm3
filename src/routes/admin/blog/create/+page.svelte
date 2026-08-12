<script lang="ts">
  /**
   * Admin Blog Post Create — Full post form with per-locale translations
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
  import FileUpload from '$lib/components/molecules/FileUpload.svelte'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  const adminT = $derived(getAdminT($page.data))
  const form = $derived($page.form)
  const errors = $derived((form as { fieldErrors?: Record<string, string[]> } | null)?.fieldErrors ?? {})
  const locales = $derived(data.locales ?? [])
  const categories = $derived(data.categories ?? [])

  let slug = $state('')
  let categoryId = $state('')
  let coverImageUrl = $state('')
  let coverImageAlt = $state('')
  let published = $state(false)
  let readingTimeMinutes = $state('')
  const translations = $state<Record<string, { title: string; excerpt: string; content: string }>>({})
  {
    for (const loc of locales) {
      translations[loc] = { title: '', excerpt: '', content: '' }
    }
  }

  function localeName(loc: string): string {
    return LOCALE_CONFIG[loc as keyof typeof LOCALE_CONFIG]?.name ?? loc
  }
</script>

<PageHeader title={adminT['admin.createPost'] ?? t('admin.createPost')}>
  {#snippet actions()}
    <a href={ADMIN_ROUTES.blog} class="text-pm-text-muted hover:text-pm-brand text-sm">&larr; {t('common.back')}</a>
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
      <div class="flex flex-col gap-1">
        <label for="field-category" class="text-sm font-medium text-pm-text">{adminT['admin.category'] ?? t('admin.category')}</label>
        <select id="field-category" name="categoryId" bind:value={categoryId}
          class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring">
          <option value="">{t('common.none')}</option>
          {#each categories as cat}
            <option value={cat.id}>{cat.slug}</option>
          {/each}
        </select>
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-pm-text">{adminT['admin.coverImageUrl'] ?? t('admin.coverImageUrl')}</label>
        <FileUpload
          bind:value={coverImageUrl}
          dropzoneLabel={t('admin.dropzoneLabel')}
          uploadingLabel={t('common.uploading')}
          tooLargeLabel={t('admin.fileTooLarge')}
          uploadFailedLabel={t('admin.uploadFailed')}
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

  <div class="flex justify-end gap-3">
    <CtaButton variant="ghost" href={ADMIN_ROUTES.blog}>{t('common.cancel')}</CtaButton>
    <CtaButton type="submit" variant="primary">{t('common.save')}</CtaButton>
  </div>
</form>
