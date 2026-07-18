<script setup lang="ts">
/**
 * Admin Settings Page
 *
 * Config-driven form to edit site settings.
 * Settings schema is defined in puppet-master.config.ts
 */
import '~/assets/css/runtime/admin-settings-form.css'
import {
  parseHeaderQuickContactItems,
  serializeHeaderQuickContactItems,
  useContactInfoOptions,
  useHeaderQuickContactOptions
} from '~/composables/useHeaderQuickContacts'
import { usePmConfig } from '~~/pm-core/app/composables/usePmConfig'
import { translateApiError } from '~/utils/api-errors'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  pageTransition: false
})

const { t, te } = useI18n()
const { toast } = useToast()
const { options: headerQuickContactOptions } = useHeaderQuickContactOptions()
const { options: contactInfoOptions } = useContactInfoOptions()
const config = usePmConfig()

useHead({
  title: () => `${t('admin.navSettings')} | ${t('admin.titleSuffix')}`
})

const settingsConfig = computed(() => config?.settings ?? [])
const activeSettingsConfig = settingsConfig
const customRenderedSettingKeys = new Set([
  'contact.headerQuickEnabled',
  'contact.headerQuickItems',
  'contact.contactPageItems',
  'contact.forceShowFormWithoutLegalDocuments'
])
const hiddenGroupKeys = new Set(['legal'])

const headers = useRequestHeaders(['cookie'])
const {
  data: settings,
  pending,
  refresh
} = await useAsyncData(
  'admin-settings',
  () => apiFetch<Record<string, Record<string, string | null>>>('/api/admin/settings', { headers }),
  { default: () => ({}) }
)

const form = reactive<Record<string, string>>(
  Object.fromEntries(activeSettingsConfig.value.map(setting => [setting.key, setting.type === 'boolean' ? 'false' : '']))
)

const defaultContactPageItems = [
  'contact.email',
  'contact.phone',
  'social.telegram',
  'social.whatsapp',
  'social.viber',
  'social.discord',
  'social.max'
]

const initialFormSnapshot = ref('')

function serializeFormState(): string {
  return JSON.stringify(
    activeSettingsConfig.value.map(setting => [setting.key, form[setting.key] ?? ''])
  )
}

watch(
  () => settings.value,
  value => {
    if (!value) return

    const settingsPayload = value || {}
    for (const setting of activeSettingsConfig.value) {
      const [group, key] = setting.key.split('.')
      const groupData = group
        ? (settingsPayload as Record<string, Record<string, string>>)[group]
        : undefined
      form[setting.key] = (key && groupData?.[key]) || (setting.type === 'boolean' ? 'false' : '')
    }

    const contactSettings = settingsPayload.contact || {}
    form['contact.headerQuickItems'] = contactSettings.headerQuickItems || ''
    form['contact.contactPageItems'] =
      contactSettings.contactPageItems ?? serializeHeaderQuickContactItems(defaultContactPageItems)

    initialFormSnapshot.value = serializeFormState()
  },
  { immediate: true }
)

const settingsByGroup = computed(() => {
  const grouped: Record<string, (typeof activeSettingsConfig.value)[number][]> = {}
  for (const setting of activeSettingsConfig.value) {
    if (customRenderedSettingKeys.has(setting.key)) {
      continue
    }
    const group = (grouped[setting.group] ??= [])
    group.push(setting)
  }
  return grouped
})

const visibleSettingGroups = computed(() =>
  config.settingGroups.filter(group => {
    if (hiddenGroupKeys.has(group.key)) {
      return false
    }

    return (settingsByGroup.value[group.key]?.length ?? 0) > 0
  })
)

const availableHeaderQuickContacts = computed(() =>
  headerQuickContactOptions.value.filter(option => {
    const value = form[option.key]
    return typeof value === 'string' && value.trim().length > 0
  })
)

const selectedHeaderQuickContactItems = computed(() =>
  parseHeaderQuickContactItems(form['contact.headerQuickItems'])
)

const selectedHeaderQuickContactSet = computed(() => new Set(selectedHeaderQuickContactItems.value))

const availableContactPageItems = computed(() =>
  contactInfoOptions.value.filter(option => {
    const value = form[option.key]
    return typeof value === 'string' && value.trim().length > 0
  })
)

const selectedContactPageItems = computed(() =>
  parseHeaderQuickContactItems(form['contact.contactPageItems'])
)

const selectedContactPageItemSet = computed(() => new Set(selectedContactPageItems.value))

watchEffect(() => {
  const availableKeys = new Set(availableHeaderQuickContacts.value.map(option => option.key))
  const normalized = selectedHeaderQuickContactItems.value.filter(key => availableKeys.has(key))
  const serialized = serializeHeaderQuickContactItems(normalized)

  if ((form['contact.headerQuickItems'] || '') !== serialized) {
    form['contact.headerQuickItems'] = serialized
  }
})

watchEffect(() => {
  const availableKeys = new Set(availableContactPageItems.value.map(option => option.key))
  const normalized = selectedContactPageItems.value.filter(key => availableKeys.has(key))
  const serialized = serializeHeaderQuickContactItems(normalized)

  if ((form['contact.contactPageItems'] || '') !== serialized) {
    form['contact.contactPageItems'] = serialized
  }
})

const hasChanges = computed(() => serializeFormState() !== initialFormSnapshot.value)

function getInputType(type: string): string {
  switch (type) {
    case 'email':
      return 'email'
    case 'url':
      return 'url'
    case 'tel':
      return 'tel'
    case 'password':
      return 'password'
    default:
      return 'text'
  }
}

function hasOptions(setting: { options?: Array<{ value: string; label: string }> }): boolean {
  return Array.isArray(setting.options) && setting.options.length > 0
}

function getSettingLabel(key: string, fallback: string): string {
  const labelKey = `settings.${key}`
  return te(labelKey) ? t(labelKey) : fallback
}

function getSettingOptionLabel(value: string, fallback: string): string {
  const labelKey = value ? `settings.${value}` : 'settings.optionNone'
  return te(labelKey) ? t(labelKey) : fallback
}

function toggleHeaderQuickContact(key: string): void {
  const next = new Set(selectedHeaderQuickContactItems.value)

  if (next.has(key)) {
    next.delete(key)
  } else {
    next.add(key)
  }

  form['contact.headerQuickItems'] = serializeHeaderQuickContactItems([...next])
}

function toggleContactPageItem(key: string): void {
  const next = new Set(selectedContactPageItems.value)

  if (next.has(key)) {
    next.delete(key)
  } else {
    next.add(key)
  }

  form['contact.contactPageItems'] = serializeHeaderQuickContactItems([...next])
}

const saving = ref(false)

async function saveSettings() {
  if (!hasChanges.value || saving.value) return

  saving.value = true

  try {
    await apiFetch('/api/admin/settings', {
      method: 'PUT',
      body: form
    })

    initialFormSnapshot.value = serializeFormState()

    await Promise.all([
      refresh(),
      refreshNuxtData('site-settings')
    ])

    toast.success(t('common.saved'))
  } catch (e: unknown) {
    toast.error(translateApiError(t, e, 'admin.failedSaveSettings'))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="admin-settings">
    <div class="page-header">
      <h1 class="page-title">{{ t('admin.settings') }}</h1>
    </div>

    <div v-if="pending" class="loading-state">{{ t('common.loading') }}</div>

    <form v-else class="settings-form" novalidate @submit.prevent="saveSettings">
      <section v-for="group in visibleSettingGroups" :key="group.key" class="card">
        <div class="card-header">
          <h2 class="section-title">{{ t(group.label) }}</h2>
        </div>

        <div class="card-body">
          <div class="form-grid">
            <div
              v-for="setting in settingsByGroup[group.key]"
              :key="setting.key"
              class="form-group"
              :class="{ 'form-group--full': setting.type === 'text' }"
            >
              <label v-if="setting.type !== 'boolean'" class="form-label">
                {{ getSettingLabel(setting.key, setting.label) }}
              </label>

              <textarea
                v-if="setting.type === 'text'"
                v-model="form[setting.key]"
                class="input"
                rows="3"
              ></textarea>

              <label v-else-if="setting.type === 'boolean'" class="checkbox">
                <input
                  v-model="form[setting.key]"
                  type="checkbox"
                  :true-value="'true'"
                  :false-value="'false'"
                />
                <span>{{ getSettingLabel(setting.key, setting.label) }}</span>
              </label>

              <select
                v-else-if="hasOptions(setting)"
                v-model="form[setting.key]"
                class="input"
              >
                <option
                  v-for="option in setting.options"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ getSettingOptionLabel(option.value, option.label) }}
                </option>
              </select>

              <input
                v-else
                v-model="form[setting.key]"
                :type="getInputType(setting.type)"
                class="input"
              />
            </div>
          </div>

          <div v-if="group.key === 'contact'" class="header-quick-picker">
            <div class="header-quick-picker__header">
              <h3 class="form-label">{{ t('admin.headerQuickContactIcons') }}</h3>
              <p class="text-secondary">
                {{ t('admin.headerQuickContactIconsDesc') }}
              </p>
            </div>

            <div v-if="availableHeaderQuickContacts.length > 0" class="header-quick-picker__grid">
              <button
                v-for="option in availableHeaderQuickContacts"
                :key="option.key"
                type="button"
                class="header-quick-picker__item"
                :class="{ 'is-active': selectedHeaderQuickContactSet.has(option.key) }"
                :aria-pressed="selectedHeaderQuickContactSet.has(option.key)"
                @click="toggleHeaderQuickContact(option.key)"
              >
                <component :is="option.icon" class="header-quick-picker__icon" />
                <span class="header-quick-picker__label">{{ option.label }}</span>
              </button>
            </div>

            <p v-else class="text-secondary">
              {{ t('admin.headerQuickContactIconsEmpty') }}
            </p>
          </div>

          <div v-if="group.key === 'contact'" class="header-quick-picker">
            <div class="header-quick-picker__header">
              <h3 class="form-label">{{ t('admin.contactPageButtons') }}</h3>
              <p class="text-secondary">
                {{ t('admin.contactPageButtonsDesc') }}
              </p>
            </div>

            <div v-if="availableContactPageItems.length > 0" class="header-quick-picker__grid">
              <button
                v-for="option in availableContactPageItems"
                :key="option.key"
                type="button"
                class="header-quick-picker__item"
                :class="{ 'is-active': selectedContactPageItemSet.has(option.key) }"
                :aria-pressed="selectedContactPageItemSet.has(option.key)"
                @click="toggleContactPageItem(option.key)"
              >
                <component :is="option.icon" class="header-quick-picker__icon" />
                <span class="header-quick-picker__label">{{ option.label }}</span>
              </button>
            </div>

            <p v-else class="text-secondary">
              {{ t('admin.contactPageButtonsEmpty') }}
            </p>
          </div>

        </div>
      </section>

      <div class="form-actions">
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="saving || !hasChanges"
        >
          {{ saving ? t('common.saving') : t('common.save') }}
        </button>
      </div>
    </form>
  </div>
</template>
