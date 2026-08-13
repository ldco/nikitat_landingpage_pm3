<script lang="ts">
  /**
   * HeaderContact — Quick contact buttons for header (PM v2 HeaderContact.vue parity)
   *
   * Renders the circular contact icon buttons only (the CTA was served by the
   * drawer footer in PM v2 and has been removed; FooterCta handles the CTA).
   *
   * Items come from settings DB (contact.headerQuickItems) with fallback to
   * HEADER_CONTACT config. Only items with non-empty values are rendered.
   *
   * Rule #1: class prop + twMerge
   *
   * @props {number} [size=20] — icon size in pixels
   * @props {string} [class] — additional CSS classes merged via twMerge
   *
   * @example
   * <HeaderContact />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { HEADER_CONTACT } from '$lib/config/site'
  import { useSettings } from '$lib/stores/settings.svelte'
  import BrandTelegram from '@tabler/icons-svelte/icons/brand-telegram'
  import BrandWhatsapp from '@tabler/icons-svelte/icons/brand-whatsapp'
  import BrandDiscord from '@tabler/icons-svelte/icons/brand-discord'
  import BrandInstagram from '@tabler/icons-svelte/icons/brand-instagram'
  import BrandFacebook from '@tabler/icons-svelte/icons/brand-facebook'
  import BrandX from '@tabler/icons-svelte/icons/brand-x'
  import BrandYoutube from '@tabler/icons-svelte/icons/brand-youtube'
  import BrandLinkedin from '@tabler/icons-svelte/icons/brand-linkedin'
  import BrandGithub from '@tabler/icons-svelte/icons/brand-github'
  import BrandVk from '@tabler/icons-svelte/icons/brand-vk'
  import BrandTiktok from '@tabler/icons-svelte/icons/brand-tiktok'
  import IconMail from '@tabler/icons-svelte/icons/mail'
  import IconPhone from '@tabler/icons-svelte/icons/phone'
  import IconMapPin from '@tabler/icons-svelte/icons/map-pin'
  import IconMessageCircle from '@tabler/icons-svelte/icons/message-circle'
  import type { ComponentType } from 'svelte'

  let {
    size = 20,
    class: className = ''
  }: {
    size?: number
    class?: string
  } = $props()

  const settings = useSettings()

  /** Icon lookup by setting key (matches PM v2 iconMap) */
  const ICON_MAP: Record<string, ComponentType> = {
    mail: IconMail,
    phone: IconPhone,
    'map-pin': IconMapPin,
    'message-circle': IconMessageCircle,
    'brand-telegram': BrandTelegram,
    'brand-whatsapp': BrandWhatsapp,
    'brand-viber': IconMessageCircle,
    'brand-discord': BrandDiscord,
    'brand-instagram': BrandInstagram,
    'brand-facebook': BrandFacebook,
    'brand-x': BrandX,
    'brand-tiktok': BrandTiktok,
    'brand-vk': BrandVk,
    'brand-youtube': BrandYoutube,
    'brand-linkedin': BrandLinkedin,
    'brand-github': BrandGithub,

    telegram: BrandTelegram,
    whatsapp: BrandWhatsapp,
    viber: IconMessageCircle,
    discord: BrandDiscord,
    instagram: BrandInstagram,
    facebook: BrandFacebook,
    x: BrandX,
    tiktok: BrandTiktok,
    vk: BrandVk,
    youtube: BrandYoutube,
    linkedin: BrandLinkedin,
    github: BrandGithub,
  }

  interface ContactItem {
    key: string
    url: string
    icon: ComponentType
  }

  function buildUrl(key: string, value: string): string {
    if (key === 'contact.phone') return `tel:${value.replace(/\s/g, '')}`
    if (key === 'contact.email') return `mailto:${value}`
    if (key === 'social.telegram' || key === 'telegram') {
      const handle = value.trim().replace(/^@/, '')
      if (!handle) return value
      if (/^https?:\/\//i.test(handle)) return handle
      return `https://t.me/${handle}`
    }
    return value
  }

  /** Parse comma-separated headerQuickItems setting into keys */
  function parseItems(value: string | null | undefined): string[] {
    if (!value) return []
    return Array.from(new Set(value.split(',').map(i => i.trim()).filter(Boolean)))
  }

  const items = $derived.by(() => {
    const result: ContactItem[] = []

    const runtimeSelection = settings.get('contact.headerQuickItems')
    const hasRuntimeSelection = runtimeSelection !== null && runtimeSelection !== undefined
    const configItems = hasRuntimeSelection ? parseItems(runtimeSelection) : HEADER_CONTACT.items

    for (const key of configItems) {
      const value = settings.get(key)
      if (!value) continue
      const iconKey = key.split('.').pop() ?? ''
      const icon = ICON_MAP[iconKey] ?? ICON_MAP[key] ?? IconMail
      result.push({ key, url: buildUrl(key, value), icon })
    }

    return result
  })

  function isExternal(url: string): boolean {
    return url.startsWith('http://') || url.startsWith('https://')
  }
</script>

{#if items.length > 0}
  <div class={twMerge(clsx('flex items-center gap-2', className))}>
    {#each items as item (item.key)}
      {@const Icon = item.icon}
      <a
        href={item.url}
        class="inline-flex items-center justify-center size-[var(--contact-icon-size)] rounded-full bg-pm-brand text-pm-white hover:bg-pm-brand-light active:bg-pm-brand-dark transition-colors duration-150"
        aria-label={item.key}
        target={isExternal(item.url) ? '_blank' : undefined}
        rel={isExternal(item.url) ? 'noopener noreferrer' : undefined}
      >
        <Icon {size} />
      </a>
    {/each}
  </div>
{/if}
