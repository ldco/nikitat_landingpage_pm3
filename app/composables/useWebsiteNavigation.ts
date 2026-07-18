import { getNavWebsiteSectionIds, getWebsiteSectionPath, isWebsiteSectionPage } from '~~/pm-core/app/types'
import { usePmConfig } from '~~/pm-core/app/composables/usePmConfig'

export function useWebsiteNavigation() {
  const route = useRoute()
  const localePath = useLocalePath()
  const config = usePmConfig()

  const sectionsConfig = computed(() => config?.sections ?? [])
  const isOnepager = computed(() => config?.features?.onepager ?? false)
  const homePath = computed(() => localePath('/'))
  const normalizedHomePath = computed(() => homePath.value.replace(/\/+$/, '') || '/')
  const normalizedCurrentPath = computed(() => route.path.replace(/\/+$/, '') || '/')
  const isHomeRoute = computed(() => normalizedCurrentPath.value === normalizedHomePath.value)
  const useLocalAnchors = computed(() => isOnepager.value && isHomeRoute.value)
  const sectionIds = computed(() => getNavWebsiteSectionIds(sectionsConfig.value))
  const anchorSectionIds = computed(() =>
    sectionsConfig.value
      .filter(section => section.inNav && !isWebsiteSectionPage(section))
      .map(section => section.id)
  )

  const { activeSection } = useScrollSpy(computed(() => (useLocalAnchors.value ? anchorSectionIds.value : [])))

  function getSectionConfig(sectionId: string) {
    return sectionsConfig.value.find(section => section.id === sectionId)
  }

  function isSectionAnchor(sectionId: string): boolean {
    const section = getSectionConfig(sectionId)
    return isOnepager.value && !!section && !isWebsiteSectionPage(section)
  }

  function resolveSectionHref(sectionId: string): string {
    const section = getSectionConfig(sectionId)

    if (section && isWebsiteSectionPage(section)) {
      return localePath(getWebsiteSectionPath(section))
    }

    if (!isOnepager.value) {
      return localePath(sectionId === 'home' ? '/' : `/${sectionId}`)
    }

    if (useLocalAnchors.value) {
      return `#${sectionId}`
    }

    return sectionId === 'home' ? homePath.value : `${homePath.value}#${sectionId}`
  }

  function resolveWebsiteHref(href?: string | null): string {
    if (!href) {
      return ''
    }

    if (!isOnepager.value || !href.startsWith('#')) {
      return href
    }

    const targetId = href.slice(1)
    if (!targetId) {
      return homePath.value
    }

    if (useLocalAnchors.value) {
      return href
    }

    return targetId === 'home' ? homePath.value : `${homePath.value}${href}`
  }

  return {
    activeSection,
    anchorSectionIds,
    homePath,
    isHomeRoute,
    isOnepager,
    isSectionAnchor,
    resolveSectionHref,
    resolveWebsiteHref,
    sectionIds,
    sectionsConfig,
    useLocalAnchors
  }
}
