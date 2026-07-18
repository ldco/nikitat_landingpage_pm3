<script setup lang="ts">
/**
 * LegalInfo Molecule
 *
 * Config-driven copyright and legal/juridical info.
 * All on one line: © 2025 Company. All rights reserved · ИНН: xxx · ОГРН: xxx · ...
 * Only shows items that have values in database.
 */

const { t } = useI18n()
const { settings } = useSiteSettings()
const currentYear = new Date().getFullYear()

// Company name for copyright (fallback to 'Puppet Master')
const companyName = computed(() => {
  return (
    settings.value?.legal.companyName ||
    settings.value?.legal.companyLegalName ||
    settings.value?.seo.title ||
    'Puppet Master'
  )
})

// Legal details (only those with values)
const legalDetails = computed(() => {
  const legal = settings.value?.legal
  if (!legal) return []

  const items: Array<{ label: string; value: string; href?: string }> = []

  if (legal.inn) items.push({ label: t('legal.fields.inn'), value: legal.inn })
  if (legal.kpp) items.push({ label: t('legal.fields.kpp'), value: legal.kpp })
  if (legal.ogrn) items.push({ label: t('legal.fields.ogrn'), value: legal.ogrn })
  if (legal.address) items.push({ label: t('legal.fields.address'), value: legal.address })
  if (legal.email) {
    items.push({
      label: t('legal.fields.email'),
      value: legal.email,
      href: `mailto:${legal.email}`
    })
  }

  return items
})
</script>

<template>
  <!-- All on ONE line: copyright + legal details -->
  <div class="legal-row">
    <span>© {{ currentYear }} {{ companyName }}. {{ t('footer.rights') }}</span>
    <template v-for="item in legalDetails" :key="item.label">
      <span class="legal-sep">·</span>
      <span>
        {{ item.label }}:
        <a v-if="item.href" :href="item.href" class="legal-link">
          {{ item.value }}
        </a>
        <template v-else>{{ item.value }}</template>
      </span>
    </template>
  </div>
</template>
