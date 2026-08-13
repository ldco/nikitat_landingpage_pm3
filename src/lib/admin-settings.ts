/**
 * Admin Settings types — shared between the settings route loader
 * (`admin/settings/+page.server.ts`) and the `SettingsForm` component.
 */
import type { SettingLayout } from '$lib/config/settings-schema'

export interface AdminSettingRow {
  key: string
  value: string | null
  type: 'string' | 'number' | 'boolean' | 'json'
  group: string
  label: string
  icon?: string
  public: boolean
  layout: SettingLayout
}

export interface AdminSettingGroup {
  key: string
  label: string
  icon?: string
  items: AdminSettingRow[]
}
