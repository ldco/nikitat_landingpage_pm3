import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { getAllSettings } from '$lib/server/services'
import { getSettingsByGroup, SETTINGS_GROUPS, type SettingDefinition } from '$lib/config/settings-schema'
import type { PageServerLoad } from './$types'

export interface AdminSettingRow {
  key: string
  value: string | null
  type: 'string' | 'number' | 'boolean' | 'json'
  group: string
  label: string
  icon?: string
  public: boolean
}

export interface AdminSettingGroup {
  key: string
  label: string
  icon?: string
  items: AdminSettingRow[]
}

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'settings')
  const all = getAllSettings()
  const byKey = new Map(all.map(s => [s.key, s]))
  const grouped = getSettingsByGroup()

  // Order groups by the canonical SETTINGS_GROUPS list so the UI renders a
  // stable, curated order (Contact, Location, Social, ...) not insertion order.
  const groupOrder = new Map(SETTINGS_GROUPS.map((g, i) => [g.key, i]))
  const groups = Object.keys(grouped)
    .sort((a, b) => (groupOrder.get(a) ?? 99) - (groupOrder.get(b) ?? 99))

  const result: AdminSettingGroup[] = groups.map(groupKey => {
    const groupMeta = SETTINGS_GROUPS.find(g => g.key === groupKey)
    const defs = grouped[groupKey] ?? []
    const items: AdminSettingRow[] = defs.map((def: SettingDefinition) => {
      const row = byKey.get(def.key)
      return {
        key: def.key,
        value: row?.value ?? null,
        type: row?.type ?? def.type,
        group: groupKey,
        label: def.label,
        icon: def.icon,
        public: def.public !== false
      }
    })
    return { key: groupKey, label: groupMeta?.label ?? groupKey, icon: groupMeta?.icon, items }
  })

  return { groups: result }
}
