<script lang="ts">
  /**
   * SettingsForm — dynamic settings-group renderer + contact quick-picker
   * block for the admin settings page.
   *
   * Owns the settings form state (keyed by setting key), the contact
   * header/contact-page quick-picker arrays (synced into the form), dirty
   * tracking via `createFormDirty`, and the bulk PUT save. The page renders
   * this component with the server-provided groups and a submit button.
   *
   * @props {AdminSettingGroup[]} groups — ordered setting groups to render
   * @props {string} [class] — additional CSS classes merged via twMerge
   *
   * @example
   * <SettingsForm {groups} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { t } from '$lib/stores/content.svelte'
  import { page } from '$app/stores'
  import { getCsrfToken } from '$lib/utils/auth'
  import { API_ROUTES } from '$lib/utils/api-paths'
  import { getOverlaysState } from '$lib/stores/overlays.svelte'
  import { createFormDirty } from '$lib/utils/form-dirty.svelte'
  import { getAdminT } from '$lib/utils/admin-translations'
  import AdminFormSection from '$lib/components/molecules/AdminFormSection.svelte'
  import ContactPicker from '$lib/components/molecules/ContactPicker.svelte'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import IconBrandTelegram from '@tabler/icons-svelte/icons/brand-telegram'
  import IconBrandWhatsapp from '@tabler/icons-svelte/icons/brand-whatsapp'
  import IconBrandDiscord from '@tabler/icons-svelte/icons/brand-discord'
  import IconBrandInstagram from '@tabler/icons-svelte/icons/brand-instagram'
  import IconBrandFacebook from '@tabler/icons-svelte/icons/brand-facebook'
  import IconBrandX from '@tabler/icons-svelte/icons/brand-x'
  import IconBrandYoutube from '@tabler/icons-svelte/icons/brand-youtube'
  import IconBrandLinkedin from '@tabler/icons-svelte/icons/brand-linkedin'
  import IconBrandGithub from '@tabler/icons-svelte/icons/brand-github'
  import IconBrandVk from '@tabler/icons-svelte/icons/brand-vk'
  import IconBrandTiktok from '@tabler/icons-svelte/icons/brand-tiktok'
  import IconMail from '@tabler/icons-svelte/icons/mail'
  import IconPhone from '@tabler/icons-svelte/icons/phone'
  import IconMapPin from '@tabler/icons-svelte/icons/map-pin'
  import IconMessageCircle from '@tabler/icons-svelte/icons/message-circle'
  import type { ComponentType } from 'svelte'
  import type { AdminSettingGroup, AdminSettingRow } from '$lib/admin-settings'

  let {
    groups,
    class: className = ''
  }: {
    groups: AdminSettingGroup[]
    class?: string
  } = $props()

  const adminT = $derived(getAdminT($page.data))
  const overlays = getOverlaysState()

  // ── Form state (PM2: reactive form keyed by setting.key) ────────────────
  // Initialized synchronously from server data so SSR renders filled inputs
  // and the contact picker options (not blank-until-hydration).
  const form = $state<Record<string, string>>({})

  {
    for (const group of groups) {
      for (const item of group.items) {
        if (form[item.key] === undefined) {
          form[item.key] = item.value ?? (item.type === 'boolean' ? 'false' : '')
        }
      }
    }
  }

  const { isDirty, markClean } = createFormDirty(() => form)
  markClean()

  let saving = $state(false)

  // ── Contact quick picker (PM2 .header-quick-picker) ─────────────────────
  const CONTACT_OPTION_KEYS = [
    'contact.email', 'contact.phone', 'social.telegram', 'social.whatsapp',
    'social.viber', 'social.discord', 'social.instagram', 'social.facebook',
    'social.twitter', 'social.youtube', 'social.linkedin', 'social.github',
    'social.vk', 'social.tiktok'
  ] as const

  const ICON_MAP: Record<string, ComponentType> = {
    mail: IconMail, phone: IconPhone, 'map-pin': IconMapPin, 'message-circle': IconMessageCircle,
    'brand-telegram': IconBrandTelegram, 'brand-whatsapp': IconBrandWhatsapp, 'brand-discord': IconBrandDiscord,
    'brand-instagram': IconBrandInstagram, 'brand-facebook': IconBrandFacebook, 'brand-x': IconBrandX,
    'brand-youtube': IconBrandYoutube, 'brand-linkedin': IconBrandLinkedin, 'brand-github': IconBrandGithub,
    'brand-vk': IconBrandVk, 'brand-tiktok': IconBrandTiktok
  }

  function parseItems(value: string | undefined): string[] {
    if (!value) return []
    return Array.from(new Set(value.split(',').map(i => i.trim()).filter(Boolean)))
  }

  function serializeItems(items: string[]): string {
    return items.join(',')
  }

  const availableContactOptions = $derived(
    CONTACT_OPTION_KEYS.filter((key): key is (typeof CONTACT_OPTION_KEYS)[number] => {
      const value = form[key]
      return typeof value === 'string' && value.trim().length > 0
    })
  )

  // Reactive contact picker arrays (synced with form string values)
  let pickerSelections = $state<Record<string, string[]>>({
    'contact.headerQuickItems': [],
    'contact.contactPageItems': []
  })

  // Init from server data synchronously
  {
    pickerSelections['contact.headerQuickItems'] = parseItems(form['contact.headerQuickItems'])
    pickerSelections['contact.contactPageItems'] = parseItems(form['contact.contactPageItems'])
  }

  // Sync arrays → form string
  $effect(() => {
    form['contact.headerQuickItems'] = serializeItems(pickerSelections['contact.headerQuickItems'] ?? [])
  })
  $effect(() => {
    form['contact.contactPageItems'] = serializeItems(pickerSelections['contact.contactPageItems'] ?? [])
  })

  // Picker-backed settings (schema layout: 'picker') → their ContactPicker
  // block copy. Single source of truth for the i18n keys of each picker block.
  const PICKER_CONFIGS: Record<string, { titleKey: string; descKey: string; emptyKey: string }> = {
    'contact.headerQuickItems': {
      titleKey: 'admin.headerQuickContactIcons',
      descKey: 'admin.headerQuickContactIconsDesc',
      emptyKey: 'admin.headerQuickContactIconsEmpty'
    },
    'contact.contactPageItems': {
      titleKey: 'admin.contactPageButtons',
      descKey: 'admin.contactPageButtonsDesc',
      emptyKey: 'admin.contactPageButtonsEmpty'
    }
  }

  // Contact option objects for ContactPicker component
  const contactOptions = $derived(
    availableContactOptions.map(key => ({
      key,
      label: optionLabel(key),
      icon: optionIcon(key)
    }))
  )

  function optionLabel(key: string): string {
    return t(`settings.${key}`)
  }

  function optionIcon(key: string): ComponentType {
    const iconKey = key.split('.').pop() ?? key
    return ICON_MAP[iconKey] ?? IconMail
  }

  function inputType(item: AdminSettingRow): string {
    if (item.type === 'number') return 'number'
    if (item.type === 'json') return 'text'
    if (item.label.includes('email')) return 'email'
    if (item.label.includes('url')) return 'url'
    if (item.label.includes('phone') || item.label.includes('telegram') || item.label.includes('whatsapp')) return 'tel'
    return 'text'
  }

  async function saveSettings(): Promise<void> {
    if (!isDirty || saving) return
    saving = true
    try {
      const payload: Record<string, string> = {}
      for (const group of groups) {
        for (const item of group.items) {
          payload[item.key] = form[item.key] ?? ''
        }
      }
      const res = await fetch(API_ROUTES.admin.settings, {
        method: 'PUT',
        headers: { 'content-type': 'application/json', 'x-csrf-token': getCsrfToken() },
        body: JSON.stringify(payload)
      })
      const body = await res.json().catch(() => null)
      if (!res.ok || body?.success === false) throw new Error()
      markClean()
      overlays.showToast(t('common.saved'), 'success')
    } catch {
      overlays.showToast(adminT['admin.failedSaveSettings'] ?? t('admin.failedSaveSettings'), 'error')
    } finally {
      saving = false
    }
  }
</script>

<form
  class={twMerge(clsx('flex flex-col gap-6', className))}
  novalidate
  onsubmit={(e) => { e.preventDefault(); saveSettings() }}
>
  {#each groups as group (group.key)}
    <AdminFormSection title={t(group.label)}>
        <div class={clsx('grid gap-4', "grid-cols-[var(--grid-admin-form)]")}>
          {#each group.items as item (item.key)}
            {#if item.layout === 'toggle' || item.type === 'boolean'}
              <!-- Deliberate full-width toggle row — booleans never sit as
                   ordinary cells in the same auto-fit grid as text fields. -->
              <div class="col-span-full flex items-center justify-between gap-4 rounded-md border border-pm-border bg-pm-bg px-4 py-3">
                <label for="setting-{item.key}" class="text-sm font-medium text-pm-text cursor-pointer">
                  {t(item.label)}
                </label>
                <input
                  id="setting-{item.key}"
                  type="checkbox"
                  checked={form[item.key] === 'true'}
                  class="size-4 accent-pm-brand flex-shrink-0"
                  onchange={(e) => form[item.key] = (e.currentTarget as HTMLInputElement).checked ? 'true' : 'false'}
                />
              </div>
            {:else if item.layout === 'picker'}
              {@const pickerConfig = PICKER_CONFIGS[item.key]}
              <input
                type="hidden"
                bind:value={form[item.key]}
              />
              {#if pickerConfig}
                <div class="col-span-full flex flex-col gap-2">
                  <h3 class="text-sm font-medium text-pm-text m-0">{adminT[pickerConfig.titleKey] ?? t(pickerConfig.titleKey)}</h3>
                  <p class="text-sm text-pm-text-muted m-0">{adminT[pickerConfig.descKey] ?? t(pickerConfig.descKey)}</p>
                  {#if contactOptions.length > 0}
                    <ContactPicker options={contactOptions} bind:selected={pickerSelections[item.key]} />
                  {:else}
                    <p class="text-sm text-pm-text-muted">{adminT[pickerConfig.emptyKey] ?? t(pickerConfig.emptyKey)}</p>
                  {/if}
                </div>
              {/if}
            {:else}
              <div class={clsx('flex flex-col gap-1', item.layout === 'full' ? 'col-span-full' : '')}>
                <label for="setting-{item.key}" class="text-sm font-medium text-pm-text">{t(item.label)}</label>
                {#if item.type === 'json'}
                  <textarea
                    id="setting-{item.key}"
                    bind:value={form[item.key]}
                    rows={3}
                    class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text font-mono focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring"
                  ></textarea>
                {:else}
                  <input
                    id="setting-{item.key}"
                    type={inputType(item)}
                    bind:value={form[item.key]}
                    class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring"
                  />
                {/if}
              </div>
            {/if}
          {/each}
        </div>
    </AdminFormSection>
  {/each}

  <div class="flex justify-end gap-4">
    <CtaButton type="submit" variant="primary" size="md" disabled={saving || !isDirty}>
      {saving ? t('common.saving') : t('common.save')}
    </CtaButton>
  </div>
</form>
