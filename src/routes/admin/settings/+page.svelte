<script lang="ts">
  /**
   * Admin Settings — PM v2 settings.vue parity
   *
   * Structure (exact PM2 DOM):
   *   page-header (title)
   *   form.settings-form (bulk save, one submit button)
   *     section.card per setting group
   *       .card-header → h2.section-title
   *       .card-body → .form-grid (auto-fit minmax(280px,1fr))
   *         .form-group (.form-group--full for textareas)
   *       .header-quick-picker (contact group only)
   *   .form-actions → save button
   *
   * All values submit together via PUT /api/admin/settings; the save button
   * is disabled until the form is dirty.
   */
  import { clsx } from 'clsx'
  import { t } from '$lib/stores/content.svelte'
  import { getCsrfToken } from '$lib/utils/auth'
  import { getOverlaysState } from '$lib/stores/overlays.svelte'
  import PageHeader from '$lib/components/atoms/PageHeader.svelte'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import AdminFormSection from '$lib/components/molecules/AdminFormSection.svelte'
  import ContactPicker from '$lib/components/molecules/ContactPicker.svelte'
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
  import type { PageData } from './$types'
  import type { AdminSettingGroup, AdminSettingRow } from './+page.server'

  let { data }: { data: PageData } = $props()

  const groups = $derived((data.groups ?? []) as AdminSettingGroup[])
  const overlays = getOverlaysState()

  // ── Form state (PM2: reactive form keyed by setting.key) ────────────────
  // Initialized synchronously from server data so SSR renders filled inputs
  // and the contact picker options (not blank-until-hydration).
  const form = $state<Record<string, string>>({})
  let initialSnapshot = $state('')

  {
    for (const group of groups) {
      for (const item of group.items) {
        if (form[item.key] === undefined) {
          form[item.key] = item.value ?? (item.type === 'boolean' ? 'false' : '')
        }
      }
    }
    initialSnapshot = serializeForm()
  }

  function serializeForm(): string {
    const flat: Array<[string, string]> = []
    for (const group of groups) {
      for (const item of group.items) {
        flat.push([item.key, form[item.key] ?? ''])
      }
    }
    return JSON.stringify(flat)
  }

  const hasChanges = $derived(serializeForm() !== initialSnapshot)

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
  let selectedHeaderQuick = $state<string[]>([])
  let selectedContactPage = $state<string[]>([])

  // Init from server data synchronously
  {
    selectedHeaderQuick = parseItems(form['contact.headerQuickItems'])
    selectedContactPage = parseItems(form['contact.contactPageItems'])
  }

  // Sync arrays → form string
  $effect(() => {
    form['contact.headerQuickItems'] = serializeItems(selectedHeaderQuick)
  })
  $effect(() => {
    form['contact.contactPageItems'] = serializeItems(selectedContactPage)
  })

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
    if (!hasChanges || saving) return
    saving = true
    try {
      const payload: Record<string, string> = {}
      for (const group of groups) {
        for (const item of group.items) {
          payload[item.key] = form[item.key] ?? ''
        }
      }
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'content-type': 'application/json', 'x-csrf-token': getCsrfToken() },
        body: JSON.stringify(payload)
      })
      const body = await res.json().catch(() => null)
      if (!res.ok || body?.success === false) throw new Error()
      initialSnapshot = serializeForm()
      overlays.showToast(t('common.saved'), 'success')
    } catch {
      overlays.showToast(t('admin.failedSaveSettings'), 'error')
    } finally {
      saving = false
    }
  }
</script>

<div class="admin-settings">
  <PageHeader title={t('admin.settings')} />

  <form class="flex flex-col gap-6" novalidate onsubmit={(e) => { e.preventDefault(); saveSettings() }}>
    {#each groups as group (group.key)}
      <AdminFormSection title={t(group.label)}>
          <div class={clsx('grid gap-4', "grid-cols-[var(--grid-admin-form)]")}>
            {#each group.items as item (item.key)}
              <div class={clsx('flex flex-col gap-1', (item.type === 'string' && (item.label.includes('address') || item.label.includes('description') || item.label.includes('headerQuickItems'))) ? 'col-span-full' : '')}>
                {#if item.type !== 'boolean'}
                  <label for="setting-{item.key}" class="text-sm font-medium text-pm-text">{t(item.label)}</label>
                {/if}

                {#if item.type === 'boolean'}
                  <label class="flex items-center gap-2 cursor-pointer text-sm text-pm-text-muted">
                    <input
                      type="checkbox"
                      checked={form[item.key] === 'true'}
                      class="size-4 accent-pm-brand flex-shrink-0"
                      onchange={(e) => form[item.key] = (e.currentTarget as HTMLInputElement).checked ? 'true' : 'false'}
                    />
                    <span>{t(item.label)}</span>
                  </label>
                {:else if item.type === 'json'}
                  <textarea
                    id="setting-{item.key}"
                    bind:value={form[item.key]}
                    rows={3}
                    class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text font-mono focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring"
                  ></textarea>
                {:else if item.key === 'contact.headerQuickItems' || item.key === 'contact.contactPageItems'}
                  <input
                    type="hidden"
                    bind:value={form[item.key]}
                  />
                {:else}
                  <input
                    id="setting-{item.key}"
                    type={inputType(item)}
                    bind:value={form[item.key]}
                    class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring"
                  />
                {/if}
              </div>
            {/each}
          </div>

          <!-- Contact group quick pickers (PM2 .header-quick-picker) -->
          {#if group.key === 'contact'}
            <div class="mt-5 pt-5 border-t border-pm-border">
              <div class="flex flex-col gap-2 mb-4">
                <h3 class="text-sm font-medium text-pm-text m-0">{t('admin.headerQuickContactIcons')}</h3>
                <p class="text-sm text-pm-text-muted m-0">{t('admin.headerQuickContactIconsDesc')}</p>
              </div>

              {#if contactOptions.length > 0}
                <ContactPicker options={contactOptions} bind:selected={selectedHeaderQuick} />
              {:else}
                <p class="text-sm text-pm-text-muted">{t('admin.headerQuickContactIconsEmpty')}</p>
              {/if}
            </div>

            <div class="mt-5 pt-5 border-t border-pm-border">
              <div class="flex flex-col gap-2 mb-4">
                <h3 class="text-sm font-medium text-pm-text m-0">{t('admin.contactPageButtons')}</h3>
                <p class="text-sm text-pm-text-muted m-0">{t('admin.contactPageButtonsDesc')}</p>
              </div>

              {#if contactOptions.length > 0}
                <ContactPicker options={contactOptions} bind:selected={selectedContactPage} />
              {:else}
                <p class="text-sm text-pm-text-muted">{t('admin.contactPageButtonsEmpty')}</p>
              {/if}
            </div>
          {/if}
      </AdminFormSection>
    {/each}

    <div class="flex justify-end gap-4">
      <CtaButton type="submit" variant="primary" size="md" disabled={saving || !hasChanges}>
        {saving ? t('common.saving') : t('common.save')}
      </CtaButton>
    </div>
  </form>
</div>
