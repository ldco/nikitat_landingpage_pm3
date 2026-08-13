<script lang="ts">
  /**
   * Admin Settings — PM v2 settings.vue parity
   *
   * Orchestration shell: renders the page header and delegates the whole form
   * (dynamic settings-group renderer, contact quick-picker block, dirty
   * tracking and bulk save) to the `SettingsForm` component.
   */
  import { t } from '$lib/stores/content.svelte'
  import { page } from '$app/stores'
  import PageHeader from '$lib/components/atoms/PageHeader.svelte'
  import SettingsForm from '$lib/components/admin/settings/SettingsForm.svelte'
  import type { PageData } from './$types'
  import type { AdminSettingGroup } from '$lib/admin-settings'
  import { getAdminT } from '$lib/utils/admin-translations'

  let { data }: { data: PageData } = $props()
  const adminT = $derived(getAdminT($page.data))

  const groups = $derived((data.groups ?? []) as AdminSettingGroup[])
</script>

<div class="admin-settings">
  <PageHeader title={adminT['admin.settings'] ?? t('admin.settings')} />

  <SettingsForm {groups} />
</div>
