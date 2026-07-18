export type LegalDocumentId = 'privacy-policy' | 'personal-data-processing' | 'terms-of-service'

interface LegalDocumentDefinition {
  id: LegalDocumentId
  path: string
  footerLabelKey: string
  titleKey: string
  bodyKey: string
}

interface ResolvedLegalDocument extends LegalDocumentDefinition {
  href: string
  label: string
  title: string
  body: string
}

export const LEGAL_DOCUMENTS: readonly LegalDocumentDefinition[] = [
  {
    id: 'privacy-policy',
    path: '/legal/privacy-policy',
    footerLabelKey: 'footer.privacy',
    titleKey: 'legalDocuments.privacy.title',
    bodyKey: 'legalDocuments.privacy.body'
  },
  {
    id: 'personal-data-processing',
    path: '/legal/personal-data-processing',
    footerLabelKey: 'footer.personalData',
    titleKey: 'legalDocuments.personalData.title',
    bodyKey: 'legalDocuments.personalData.body'
  },
  {
    id: 'terms-of-service',
    path: '/legal/terms-of-service',
    footerLabelKey: 'footer.terms',
    titleKey: 'legalDocuments.terms.title',
    bodyKey: 'legalDocuments.terms.body'
  }
] as const

export function resolveLegalDocument(id: string): LegalDocumentDefinition | null {
  return LEGAL_DOCUMENTS.find(document => document.id === id) ?? null
}

function applyLegalBindings(
  value: string,
  bindings: Record<string, string | number>
): string {
  return value.replace(/\{([A-Za-z0-9_]+)\}/g, (_, token: string) => {
    const binding = bindings[token]
    return binding === undefined || binding === null ? '' : String(binding)
  })
}

export function useLegalDocumentText() {
  const { t, te, locale } = useI18n()

  function getText(
    key: string,
    bindings: Record<string, string | number> = {}
  ): string {
    if (!te(key, locale.value)) {
      return ''
    }

    return applyLegalBindings(t(key, bindings), bindings).trim()
  }

  return {
    getText
  }
}

export function useLegalDocuments() {
  const localePath = useLocalePath()
  const { locale } = useI18n()
  const { getText } = useLegalDocumentText()
  const documentsByLocale = useState<Record<string, ResolvedLegalDocument[]>>(
    'legal-documents-by-locale',
    () => ({})
  )

  const resolvedDocuments = computed<ResolvedLegalDocument[]>(() =>
    LEGAL_DOCUMENTS.map(document => {
      const title = getText(document.titleKey) || getText(document.footerLabelKey)
      const body = getText(document.bodyKey)

      return {
        ...document,
        href: localePath(document.path),
        label: title,
        title,
        body
      }
    }).filter(document => document.title.trim() !== '' && document.body.trim() !== '')
  )

  if (import.meta.server) {
    documentsByLocale.value[locale.value] = resolvedDocuments.value
  }

  const documents = computed(() => {
    const resolved = resolvedDocuments.value
    if (resolved.length > 0) {
      return resolved
    }

    if (Object.prototype.hasOwnProperty.call(documentsByLocale.value, locale.value)) {
      return documentsByLocale.value[locale.value] ?? []
    }

    return resolved
  })

  return {
    documents
  }
}
