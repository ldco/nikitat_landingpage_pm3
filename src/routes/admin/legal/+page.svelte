<script lang="ts">
  /**
   * Admin Legal — PM v2 legal.vue parity
   *
   * Orchestration shell: company-details + contact-gate settings form and the
   * combined bulk save. The per-locale legal documents editor (status grid,
   * locale tabs, placeholder tokens, document bodies) lives in
   * `LegalDocumentsEditor` (bound `docsForm`); dirty tracking reuses the shared
   * `createFormDirty` helper.
   *
   * Legal settings save via PUT /api/admin/settings (bulk); document bodies
   * save via PUT /api/admin/legal/:slug per locale.
   */
  import { t } from '$lib/stores/content.svelte'
  import { page } from '$app/stores'
  import { getCsrfToken } from '$lib/utils/auth'
  import { API_ROUTES } from '$lib/utils/api-paths'
  import { getOverlaysState } from '$lib/stores/overlays.svelte'
  import { createFormDirty } from '$lib/utils/form-dirty.svelte'
  import { hydrateDocsForm, LEGAL_DOC_SLUGS } from '$lib/utils/legal-editor'
  import PageHeader from '$lib/components/atoms/PageHeader.svelte'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import AdminFormSection from '$lib/components/molecules/AdminFormSection.svelte'
  import LegalDocumentsEditor from '$lib/components/admin/legal/LegalDocumentsEditor.svelte'
  import type { PageData } from './$types'
  import type { AdminLegalRow } from './+page.server'
  import { getAdminT } from '$lib/utils/admin-translations'

  let { data }: { data: PageData } = $props()
  const adminT = $derived(getAdminT($page.data))

  const byLocale = $derived((data.byLocale ?? {}) as Record<string, AdminLegalRow[]>)
  const locales = $derived((data.locales ?? []) as string[])
  const settingsInitial = $derived((data.settings ?? {}) as Record<string, string>)

  const overlays = getOverlaysState()

  const LEGAL_SETTING_KEYS = [
    'legal.companyLegalName',
    'legal.companyName',
    'legal.inn',
    'legal.kpp',
    'legal.ogrn',
    'legal.address',
    'legal.email',
    'contact.forceShowFormWithoutLegalDocuments'
  ] as const

  // ── Legal settings form (company details + contact gate) ─────────────────
  const legalSettingsForm = $state<Record<string, string>>({})

  // Synchronous init (SSR renders filled fields; no blank-until-hydration).
  {
    for (const key of LEGAL_SETTING_KEYS) {
      if (legalSettingsForm[key] === undefined) {
        legalSettingsForm[key] = settingsInitial[key] ?? (key === 'contact.forceShowFormWithoutLegalDocuments' ? 'false' : '')
      }
    }
  }

  // Hydrate EVERY locale from the server-provided document set in the first
  // synchronous pass: SSR renders filled textareas and a tab switch shows the
  // target locale's real content (never a blank pre-initialized row). Missing
  // rows hydrate to '' so the "missing document" state stays accurate.
  // `docsForm` is a `let` (not `const`) because LegalDocumentsEditor binds to it.
  let docsForm = $state(hydrateDocsForm(byLocale, locales, LEGAL_DOC_SLUGS))

  const { isDirty, markClean } = createFormDirty(() => ({
    settings: legalSettingsForm,
    docs: docsForm
  }))
  markClean()

  const forceShowForm = $derived(legalSettingsForm['contact.forceShowFormWithoutLegalDocuments'] === 'true')
  let saving = $state(false)

  async function saveLegalPage(): Promise<void> {
    if (!isDirty || saving) return
    saving = true
    try {
      // 1. Save legal settings (bulk)
      const settingsPayload: Record<string, string> = {}
      for (const key of LEGAL_SETTING_KEYS) settingsPayload[key] = legalSettingsForm[key] ?? ''
      const sRes = await fetch(API_ROUTES.admin.settings, {
        method: 'PUT',
        headers: { 'content-type': 'application/json', 'x-csrf-token': getCsrfToken() },
        body: JSON.stringify(settingsPayload)
      })
      const sBody = await sRes.json().catch(() => null)
      if (!sRes.ok || sBody?.success === false) throw new Error()

      // 2. Save every document body for every locale
      for (const slug of LEGAL_DOC_SLUGS) {
        for (const loc of locales) {
          const content = docsForm[slug]?.[loc] ?? ''
          if (content.trim().length === 0) continue // skip untouched empties
          const dRes = await fetch(API_ROUTES.admin.legal.bySlug(slug), {
            method: 'PUT',
            headers: { 'content-type': 'application/json', 'x-csrf-token': getCsrfToken() },
            body: JSON.stringify({ locale: loc, content })
          })
          const dBody = await dRes.json().catch(() => null)
          if (!dRes.ok || dBody?.success === false) throw new Error()
        }
      }

      markClean()
      overlays.showToast(t('common.saved'), 'success')
    } catch {
      overlays.showToast(adminT['admin.legalSaveFailed'] ?? t('admin.legalSaveFailed'), 'error')
    } finally {
      saving = false
    }
  }
</script>

<div class="admin-legal">
  <PageHeader title={adminT['admin.legal'] ?? t('admin.legal')} subtitle={adminT['admin.legalPageSubtitle'] ?? t('admin.legalPageSubtitle')} />

  <form class="flex flex-col gap-6" novalidate onsubmit={(e) => { e.preventDefault(); saveLegalPage() }}>
    <!-- Company details (PM2 settings-form card) -->
    <AdminFormSection title={adminT['admin.legalCompanyTitle'] ?? t('admin.legalCompanyTitle')}>
      <div class="grid gap-4 grid-cols-[var(--grid-admin-form)]">
          <div class="flex flex-col gap-1">
            <label for="field-legal.companyLegalName" class="text-sm font-medium text-pm-text">{t('legal.fields.companyLegalName')}</label>
            <input id="field-legal.companyLegalName" bind:value={legalSettingsForm['legal.companyLegalName']} type="text" class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring" />
          </div>
          <div class="flex flex-col gap-1">
            <label for="field-legal.companyName" class="text-sm font-medium text-pm-text">{t('legal.fields.companyName')}</label>
            <input id="field-legal.companyName" bind:value={legalSettingsForm['legal.companyName']} type="text" class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring" />
          </div>
          <div class="flex flex-col gap-1">
            <label for="field-legal.inn" class="text-sm font-medium text-pm-text">{t('legal.fields.inn')}</label>
            <input id="field-legal.inn" bind:value={legalSettingsForm['legal.inn']} type="text" class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring" />
          </div>
          <div class="flex flex-col gap-1">
            <label for="field-legal.kpp" class="text-sm font-medium text-pm-text">{t('legal.fields.kpp')}</label>
            <input id="field-legal.kpp" bind:value={legalSettingsForm['legal.kpp']} type="text" class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring" />
          </div>
          <div class="flex flex-col gap-1">
            <label for="field-legal.ogrn" class="text-sm font-medium text-pm-text">{t('legal.fields.ogrn')}</label>
            <input id="field-legal.ogrn" bind:value={legalSettingsForm['legal.ogrn']} type="text" class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring" />
          </div>
          <div class="flex flex-col gap-1 col-span-full">
            <label for="field-legal.address" class="text-sm font-medium text-pm-text">{t('legal.fields.address')}</label>
            <input id="field-legal.address" bind:value={legalSettingsForm['legal.address']} type="text" class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring" />
          </div>
          <div class="flex flex-col gap-1">
            <label for="field-legal.email" class="text-sm font-medium text-pm-text">{t('legal.fields.email')}</label>
            <input id="field-legal.email" bind:value={legalSettingsForm['legal.email']} type="email" class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring" />
          </div>
      </div>
    </AdminFormSection>

    <!-- Contact form legal gate (PM2 checkbox + description) -->
    <AdminFormSection title={adminT['admin.legalContactFormTitle'] ?? t('admin.legalContactFormTitle')}>
      <label class="flex items-center gap-2 cursor-pointer text-sm text-pm-text-muted">
          <input
            type="checkbox"
            checked={legalSettingsForm['contact.forceShowFormWithoutLegalDocuments'] === 'true'}
            class="size-4 accent-pm-brand flex-shrink-0"
            onchange={(e) => legalSettingsForm['contact.forceShowFormWithoutLegalDocuments'] = (e.currentTarget as HTMLInputElement).checked ? 'true' : 'false'}
          />
          <span>{t('settings.contact.forceShowFormWithoutLegalDocuments')}</span>
        </label>
      <p class="text-sm text-pm-text-muted mt-4 mb-0">{adminT['admin.legalContactFormWithoutDocumentsDesc'] ?? t('admin.legalContactFormWithoutDocumentsDesc')}</p>
    </AdminFormSection>

    <!-- Legal documents (PM2 admin-legal-page.css) -->
    <LegalDocumentsEditor bind:docsForm={docsForm} {locales} localeNames={data.localeNames ?? {}} {forceShowForm} />

    <div class="flex justify-end gap-4">
      <CtaButton type="submit" variant="primary" size="md" disabled={saving || !isDirty}>
        {saving ? t('common.saving') : t('common.save')}
      </CtaButton>
    </div>
  </form>
</div>
