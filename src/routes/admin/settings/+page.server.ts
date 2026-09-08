import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { getAllSettings } from '$lib/server/services'
import { getSettingsByGroup, SETTINGS_CUSTOM_RENDERED_KEYS, SETTINGS_HIDDEN_GROUPS, SETTINGS_GROUPS, type SettingDefinition } from '$lib/config/settings-schema'
import type { AdminSettingGroup, AdminSettingRow } from '$lib/admin-settings'
import type { PageServerLoad } from './$types'

export type { AdminSettingGroup, AdminSettingRow } from '$lib/admin-settings'

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'settings')
  const all = getAllSettings()
  const byKey = new Map(all.map(s => [s.key, s]))
  const grouped = getSettingsByGroup()

  // Order groups by the canonical SETTINGS_GROUPS list so the UI renders a
  // stable, curated order (Contact, Location, Social, ...) not insertion order.
  const groupOrder = new Map(SETTINGS_GROUPS.map((g, i) => [g.key, i]))
  // The settings page owns ONLY what has no dedicated editor elsewhere
  // (PM v2 `hiddenGroupKeys` + `customRenderedSettingKeys` parity): the legal
  // group lives on the legal page, and the contact-form gate toggle has its
  // editor there too — neither may appear on /admin/settings.
  const groups = Object.keys(grouped)
    .filter(groupKey => !SETTINGS_HIDDEN_GROUPS.has(groupKey))
    .sort((a, b) => (groupOrder.get(a) ?? 99) - (groupOrder.get(b) ?? 99))

  const result: AdminSettingGroup[] = groups.map(groupKey => {
    const groupMeta = SETTINGS_GROUPS.find(g => g.key === groupKey)
    const defs = (grouped[groupKey] ?? []).filter(def => !SETTINGS_CUSTOM_RENDERED_KEYS.has(def.key))
    const items: AdminSettingRow[] = defs.map((def: SettingDefinition) => {
      const row = byKey.get(def.key)
      return {
        key: def.key,
        value: row?.value ?? null,
        type: row?.type ?? def.type,
        group: groupKey,
        label: def.label,
        icon: def.icon,
        public: def.public !== false,
        layout: def.layout ?? 'standard'
      }
    })
    return { key: groupKey, label: groupMeta?.label ?? groupKey, icon: groupMeta?.icon, items }
  })

  return { groups: result }
}
