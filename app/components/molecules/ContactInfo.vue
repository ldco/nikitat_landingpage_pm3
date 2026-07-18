<script setup lang="ts">
/**
 * ContactInfo Molecule
 *
 * Config-driven contact information display.
 * - Reads from useSiteSettings()
 * - Only renders items that have values
 * - Icons from Tabler
 * - Location special handling:
 *   - Empty: hidden
 *   - Address text: show with icon
 *   - Coordinates (lat,lng): show Yandex map widget
 */

import {
  buildHeaderQuickContactUrl,
  parseHeaderQuickContactItems,
  useContactInfoOptions
} from '~/composables/useHeaderQuickContacts'
import type { Component } from 'vue'

const { t } = useI18n()

defineProps<{
  /** Show in vertical list (default) or horizontal */
  horizontal?: boolean
  /** Show map if location has coordinates */
  showMap?: boolean
}>()

const { settings } = useSiteSettings()
const { optionsByKey } = useContactInfoOptions()
const defaultContactPageItems = [
  'contact.email',
  'contact.phone',
  'social.telegram',
  'social.whatsapp',
  'social.viber',
  'social.discord',
  'social.max'
]

function getSettingValueByKey(key: string): string {
  const [group, field] = key.split('.')
  if (!group || !field) return ''

  const siteSettings = settings.value
  const groupData = siteSettings?.[group as keyof typeof siteSettings]
  if (!groupData || typeof groupData !== 'object') return ''

  const value = (groupData as Record<string, string | null>)[field]
  return typeof value === 'string' ? value.trim() : ''
}

const shouldShowLocation = computed(() => !!settings.value?.contact.location?.trim())
const workingHours = computed(() => settings.value?.contact.workingHours?.trim() || '')
const selectedContactPageKeys = computed(() => {
  const rawSelection = settings.value?.contact.contactPageItems
  const selectedItems =
    rawSelection === null || rawSelection === undefined
      ? defaultContactPageItems
      : parseHeaderQuickContactItems(rawSelection)

  return selectedItems.filter(key => optionsByKey.value[key])
})

// Check if location is coordinates (format: "lat,lng" or "lat, lng")
const isCoordinates = computed(() => {
  const loc = settings.value?.contact.location
  if (!shouldShowLocation.value) return false
  if (!loc) return false
  // Match pattern: number,number (with optional spaces and decimals)
  return /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/.test(loc.trim())
})

// Parse coordinates for map
const coordinates = computed(() => {
  if (!isCoordinates.value) return null
  const loc = settings.value?.contact.location
  if (!loc) return null
  const [lat, lng] = loc.split(',').map((s: string) => parseFloat(s.trim()))
  return { lat, lng }
})

// Yandex map embed URL
const mapUrl = computed(() => {
  if (!coordinates.value) return null
  const { lat, lng } = coordinates.value
  // Yandex Maps static embed
  return `https://yandex.com/map-widget/v1/?ll=${lng},${lat}&z=15&pt=${lng},${lat},pm2rdm`
})

// Contact items to display (only non-empty)
const contactItems = computed(() => {
  const items: Array<{ key: string; value: string; icon: Component; href?: string }> = []
  for (const key of selectedContactPageKeys.value) {
    const option = optionsByKey.value[key]
    const value = getSettingValueByKey(key)

    if (!option || !value) {
      continue
    }

    if (key === 'contact.location' && isCoordinates.value) {
      continue
    }

    items.push({
      key,
      value,
      icon: option.icon,
      href: key === 'contact.location' ? undefined : buildHeaderQuickContactUrl(key, value)
    })
  }

  return items
})
</script>

<template>
  <div
    v-if="contactItems.length > 0 || (showMap && coordinates) || (showMap && workingHours)"
    class="contact-info"
    :class="{ 'contact-info--horizontal': horizontal }"
  >
    <!-- Contact items list -->
    <div v-if="contactItems.length > 0" class="contact-info-list">
      <component
        :is="item.href ? 'a' : 'span'"
        v-for="item in contactItems"
        :key="item.key"
        :href="item.href"
        class="contact-info-item"
        :class="{ 'contact-info-item--link': item.href }"
      >
        <component :is="item.icon" class="contact-info-icon" />
        <span class="contact-info-value">{{ item.value }}</span>
      </component>
    </div>

    <!-- Yandex Map (if coordinates and showMap) -->
    <div v-if="showMap && coordinates && mapUrl" class="contact-info-map">
      <iframe
        :src="mapUrl"
        width="100%"
        height="300"
        frameborder="0"
        allowfullscreen
        loading="lazy"
        :title="t('common.locationMap')"
      />
    </div>

    <div v-if="showMap && workingHours" class="contact-info-location-details">
      <span class="contact-info-location-label">{{ t('settings.contact.workingHours') }}</span>
      <span class="contact-info-location-value">{{ workingHours }}</span>
    </div>
  </div>
</template>
