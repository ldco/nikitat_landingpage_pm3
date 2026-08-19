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
  import AdminEditorPage from '$lib/components/molecules/AdminEditorPage.svelte'
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

  let slug = $state('')
  let imageUrl = $state('')
  let hoverImageUrl = $state('')
  let category = $state('')
  let order = $state('0')
  let published = $state(false)

  const translations = $state<Record<string, { title: string; description: string }>>({})
  // Per-locale explicit-removal intent (the `remove_<loc>` checkboxes below).
  // Part of the dirty source so a removal-only edit enables Save — toggling
  // the checkbox must count as a change even when no field text is edited.
  const removals = $state<Record<string, boolean>>({})

  const { isDirty, markClean, guardNavigation } = createFormDirty(() => ({
    slug,
    imageUrl,
    hoverImageUrl,
    category,
    order,
    published,
    translations,
    removals
  }))

  // Seed the editable form from the server-loaded record. Runs before the
  // first paint (no blank flash) and re-seeds whenever the record changes, so
  // client-side navigation between two records can never show stale values.
  $effect.pre(() => {
    slug = p.slug
    imageUrl = p.imageUrl ?? ''
    hoverImageUrl = p.hoverImageUrl ?? ''
    category = p.category ?? ''
    order = p.order !== null ? String(p.order) : '0'
    published = p.published === true
    for (const loc of locales) {
      const row = featureTranslations.find(r => r.locale === loc)
      translations[loc] = {
        title: row?.title ?? '',
        description: row?.description ?? ''
      }
      removals[loc] = false
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
  backHref={ADMIN_ROUTES.features}
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
        <label class="flex items-center gap-2 text-sm text-pm-text-muted">
          <input type="checkbox" name={`remove_${loc}`} value="on" bind:checked={removals[loc]} />
          {adminT['admin.removeTranslation'] ?? t('admin.removeTranslation')}
        </label>
      </div>
    </AdminFormSection>
  {/each}
</AdminEditorPage>
