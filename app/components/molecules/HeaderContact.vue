<script setup lang="ts">
/**
 * HeaderContact Molecule
 *
 * Quick contact buttons for header.
 *
 * Uses contact and social settings from database.
 * Admin can toggle which filled channels should appear in the header.
 */
import type { Component } from 'vue'
import {
  buildHeaderQuickContactUrl,
  headerCtaOptionKey,
  parseHeaderQuickContactItems,
  useHeaderQuickContactOptions
} from '~/composables/useHeaderQuickContacts'
import { usePmConfig } from '~~/pm-core/app/composables/usePmConfig'

const props = withDefaults(
  defineProps<{
    mode?: 'all' | 'contacts' | 'cta'
  }>(),
  {
    mode: 'all'
  }
)

// Get contact values from database
const { settings } = useSiteSettings()
const { optionsByKey } = useHeaderQuickContactOptions()
const config = usePmConfig()
const { t } = useI18n()
const ctaLabel = computed(() => t('cta.primaryButton'))

// SSR-safe config access with defensive defaults
const headerContactConfig = computed(() => config?.headerContact ?? { items: [] })

// Helper to get nested value from settings using dot notation key
function getSettingValue(key: string): string | null {
  const parts = key.split('.')
  if (parts.length !== 2) return null
  const [group, field] = parts
  if (!group || !field) return null
  const groupData = settings.value?.[group as keyof typeof settings.value]
  if (!groupData || typeof groupData !== 'object') return null
  return (groupData as Record<string, string | null>)[field] || null
}

const contactItems = computed(() => {
  const items: Array<{ key: string; url: string; icon: Component; label: string; isCta: boolean }> = []

  const runtimeSelectionValue = settings.value?.contact.headerQuickItems
  const runtimeItems = parseHeaderQuickContactItems(runtimeSelectionValue)
  const hasRuntimeSelection = runtimeSelectionValue !== null && runtimeSelectionValue !== undefined
  const configItems = hasRuntimeSelection
    ? runtimeItems
    : (headerContactConfig.value.items ?? defaultItems)

  for (const configKey of configItems) {
    const key: string = configKey
    const value = getSettingValue(key)
    if (!value) continue

    const option = optionsByKey.value[key]
    if (!option) continue

    items.push({
      key,
      url: buildHeaderQuickContactUrl(key, value),
      icon: option.icon,
      label: option.label,
      isCta: key === headerCtaOptionKey
    })
  }

  return items
})

const visibleContactItems = computed(() =>
  contactItems.value.filter(item => !item.isCta && props.mode !== 'cta')
)

const visibleCtaItems = computed(() =>
  contactItems.value.filter(item => item.isCta && props.mode !== 'contacts')
)

const visibleItems = computed(() => [...visibleContactItems.value, ...visibleCtaItems.value])

const defaultItems: string[] = ['contact.email', 'social.telegram']

function isExternalUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://')
}
</script>

<template>
  <div v-if="visibleItems.length > 0" class="header-contact">
    <a
      v-for="item in visibleContactItems"
      :key="item.key"
      :href="item.url"
      class="header-contact-btn action-surface action-surface--brand"
      :aria-label="item.label"
      :target="isExternalUrl(item.url) ? '_blank' : undefined"
      :rel="isExternalUrl(item.url) ? 'noopener noreferrer' : undefined"
    >
      <component :is="item.icon" class="header-contact-icon" />
    </a>

    <a
      v-for="item in visibleCtaItems"
      :key="item.key"
      :href="item.url"
      class="header-contact-cta action-surface action-surface--brand"
      :aria-label="ctaLabel"
      :target="isExternalUrl(item.url) ? '_blank' : undefined"
      :rel="isExternalUrl(item.url) ? 'noopener noreferrer' : undefined"
    >
      <component :is="item.icon" class="header-contact-icon" />
      <span class="header-contact-cta-label">{{ ctaLabel }}</span>
    </a>
  </div>
</template>
