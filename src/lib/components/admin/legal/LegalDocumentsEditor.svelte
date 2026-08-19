<script lang="ts">
  /**
   * LegalDocumentsEditor — per-locale legal document status grid + body editor.
   *
   * Owns the active locale tab and renders the per-locale status cards, locale
   * tabs with missing-document indicators, active-locale status badges,
   * placeholder tokens and the MarkdownEditor per document slug. The document
   * bodies live in the bindable `docsForm` (hydrated by the page from the
   * server-provided `byLocale` set) so the page keeps save + dirty tracking.
   *
   * @props {Record<string, Record<string, string>>} docsForm — per-slug/per-locale bodies (bindable)
   * @props {string[]} locales — configured locales
   * @props {Record<string,string>} localeNames — display names per locale
   * @props {boolean} [forceShowForm=false] — contact gate bypassed setting
   * @props {string} [class] — additional CSS classes merged via twMerge
   *
   * @example
   * <LegalDocumentsEditor bind:docsForm={docsForm} {locales} {localeNames} {forceShowForm} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { untrack } from 'svelte'
  import { t } from '$lib/stores/content.svelte'
  import { renderLegalMarkdown } from '$lib/utils/legal-markdown'
  import { resolveInitialLocale } from '$lib/utils/admin-locale'
  import { LEGAL_DOC_SLUGS } from '$lib/utils/legal-editor'
  import AdminFormSection from '$lib/components/molecules/AdminFormSection.svelte'
  import MarkdownEditor from '$lib/components/molecules/MarkdownEditor.svelte'
  import AdminTabs from '$lib/components/admin/AdminTabs.svelte'

  const PLACEHOLDER_TOKENS = ['{companyLegalName}', '{companyName}', '{inn}', '{kpp}', '{ogrn}', '{legalAddress}', '{legalEmail}']

  interface LegalLocaleStatus {
    locale: string
    completeCount: number
    totalCount: number
    missingCount: number
    hasPrivacy: boolean
    hasPersonalData: boolean
    contactFormReady: boolean
    allComplete: boolean
  }

  let {
    docsForm = $bindable({}),
    locales = [],
    localeNames = {},
    forceShowForm = false,
    class: className = ''
  }: {
    docsForm: Record<string, Record<string, string>>
    locales: string[]
    localeNames: Record<string, string>
    forceShowForm?: boolean
    class?: string
  } = $props()

  // Intentional one-time capture: the active tab never tracks prop changes.
  const initLocales = untrack(() => locales)
  const initialLocale = resolveInitialLocale(initLocales)
  let activeLocale = $state(initialLocale)

  function docLabel(slug: string): string {
    if (slug === 'privacy-policy') return t('footer.privacy')
    if (slug === 'personal-data-policy') return t('footer.personalData')
    return t('footer.terms')
  }

  function documentHasBody(slug: string, loc: string): boolean {
    return (docsForm[slug]?.[loc] ?? '').trim().length > 0
  }

  function documentComplete(slug: string, loc: string): boolean {
    // PM2: title always exists (footer labels are static); body determines status
    return documentHasBody(slug, loc)
  }

  function getLocaleStatus(loc: string): LegalLocaleStatus {
    const completeCount = LEGAL_DOC_SLUGS.filter(slug => documentComplete(slug, loc)).length
    const hasPrivacy = documentComplete('privacy-policy', loc)
    const hasPersonalData = documentComplete('personal-data-policy', loc)
    return {
      locale: loc,
      completeCount,
      totalCount: LEGAL_DOC_SLUGS.length,
      missingCount: LEGAL_DOC_SLUGS.length - completeCount,
      hasPrivacy,
      hasPersonalData,
      contactFormReady: hasPrivacy && hasPersonalData,
      allComplete: completeCount === LEGAL_DOC_SLUGS.length
    }
  }

  const activeLocaleStatus = $derived(getLocaleStatus(activeLocale))

  const legalTabs = $derived(locales.map(loc => ({
    id: loc,
    label: localeNames[loc] || loc.toUpperCase()
  })))

  const legalTabIndicator = (id: string) => getLocaleStatus(id).missingCount > 0

  function documentsStatusLabel(status: LegalLocaleStatus): string {
    return `${status.completeCount} of ${status.totalCount} documents complete`
  }

  function contactGateStatusLabel(status: LegalLocaleStatus): string {
    if (forceShowForm) return t('admin.legalContactFormBypassEnabled')
    if (status.contactFormReady) return t('admin.legalContactFormReady')
    return t('admin.legalContactFormBlocked')
  }

  function documentStatusLabel(slug: string, loc: string): string {
    if (documentComplete(slug, loc)) return t('admin.legalDocumentReady')
    return t('admin.legalDocumentMissingBody')
  }
</script>

<AdminFormSection class={className} title={t('admin.legalDocumentsTitle')}>
  <p class="text-sm text-pm-text-muted mt-0 mb-4">{t('admin.legalDocumentsSubtitle')}</p>

  <!-- Status grid: one card per locale -->
  <div class="grid gap-3 grid-cols-[var(--grid-admin-status)] my-5">
    {#each locales as loc (loc)}
      {@const status = getLocaleStatus(loc)}
      <div class="grid gap-3 p-4 border border-pm-border rounded-md bg-pm-bg-sunken">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-sm font-semibold text-pm-text">{localeNames[loc] || loc.toUpperCase()}</span>
          <span class={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', status.allComplete ? 'bg-pm-success-bg text-pm-success' : 'bg-pm-warning-bg text-pm-warning')}>
            {documentsStatusLabel(status)}
          </span>
        </div>
        <span class={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium self-start', forceShowForm ? 'bg-pm-danger-bg text-pm-danger' : status.contactFormReady ? 'bg-pm-success-bg text-pm-success' : 'bg-pm-warning-bg text-pm-warning')}>
          {contactGateStatusLabel(status)}
        </span>
      </div>
    {/each}
  </div>

  <!-- Locale tabs (using AdminTabs component) -->
  <AdminTabs tabs={legalTabs} active={activeLocale} indicator={legalTabIndicator} onchange={(id) => activeLocale = id} />

  <!-- Active locale status badges -->
  <div class="flex flex-wrap items-center gap-2 mb-5">
    <span class={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', activeLocaleStatus.allComplete ? 'bg-pm-success-bg text-pm-success' : 'bg-pm-warning-bg text-pm-warning')}>
      {documentsStatusLabel(activeLocaleStatus)}
    </span>
    <span class={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', forceShowForm ? 'bg-pm-danger-bg text-pm-danger' : activeLocaleStatus.contactFormReady ? 'bg-pm-success-bg text-pm-success' : 'bg-pm-warning-bg text-pm-warning')}>
      {contactGateStatusLabel(activeLocaleStatus)}
    </span>
  </div>

  <!-- Placeholder tokens -->
  <div class="flex flex-wrap items-center gap-2 mb-6">
    <span class="text-sm text-pm-text-muted me-2">{t('admin.legalAvailableTokens')}</span>
    {#each PLACEHOLDER_TOKENS as token (token)}
      <code class="inline-flex items-center min-h-8 px-2 border border-pm-border rounded-full bg-pm-bg-elevated text-xs text-pm-text">{token}</code>
    {/each}
  </div>

  <!-- Documents editor -->
  <div class="flex flex-col gap-4">
    {#each LEGAL_DOC_SLUGS as slug (slug)}
      <div class="grid gap-4 pt-5 border-t border-pm-border first:pt-0 first:border-t-0">
        <h3 class="m-0 flex flex-wrap items-center gap-2 text-lg font-semibold text-pm-text leading-tight">
          <span>{docLabel(slug)}</span>
          <span class={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', documentComplete(slug, activeLocale) ? 'bg-pm-success-bg text-pm-success' : 'bg-pm-warning-bg text-pm-warning')}>
            {documentStatusLabel(slug, activeLocale)}
          </span>
        </h3>

        <MarkdownEditor
          content={docsForm[slug]?.[activeLocale] ?? ''}
          onchange={(v) => {
            docsForm[slug] = docsForm[slug] ?? {}
            docsForm[slug][activeLocale] = v
          }}
          previewHtml={renderLegalMarkdown(docsForm[slug]?.[activeLocale] ?? '')}
          label={t('admin.legalDocumentBody')}
          editLabel={t('admin.legalEditMode')}
          previewLabel={t('admin.legalPreviewMode')}
        />
      </div>
    {/each}
  </div>
</AdminFormSection>
