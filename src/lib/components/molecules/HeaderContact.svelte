<script lang="ts">
  /**
   * HeaderContact — Quick contact buttons for header (PM v2 HeaderContact.vue parity)
   *
   * Modes:
   *   - 'all'      — contact icons + CTA
   *   - 'contacts' — only contact icon buttons
   *   - 'cta'      — only the CTA button
   *
   * Items come from settings DB (contact.headerQuickItems) with fallback to
   * HEADER_CONTACT config. Only items with non-empty values are rendered.
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { t } from '$lib/stores/content.svelte'
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
  import IconArrowRight from '@tabler/icons-svelte/icons/arrow-right'
  import type { ComponentType } from 'svelte'

  type Mode = 'all' | 'contacts' | 'cta'

  let {
    mode = 'all',
    size = 20,
    class: className = ''
  }: {
    mode?: Mode
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
    'arrow-right': IconArrowRight,

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

  const CTA_KEY = 'footer.ctaUrl'

  interface ContactItem {
    key: string
    url: string
    icon: ComponentType
    isCta: boolean
  }

  function buildUrl(key: string, value: string): string {
    if (key === CTA_KEY) return value
    if (key === 'contact.phone') return `tel:${value.replace(/\s/g, '')}`
    if (key === 'contact.email') return `mailto:${value}`
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
      const iconKey = key === CTA_KEY ? 'arrow-right' : key.split('.').pop() ?? ''
      const icon = ICON_MAP[iconKey] ?? ICON_MAP[key] ?? IconMail
      result.push({ key, url: buildUrl(key, value), icon, isCta: key === CTA_KEY })
    }

    return result
  })

  const visibleContacts = $derived(items.filter(i => !i.isCta && mode !== 'cta'))
  const visibleCtas = $derived(items.filter(i => i.isCta && mode !== 'contacts'))

  const ctaLabel = t('cta.primaryButton')

  function isExternal(url: string): boolean {
    return url.startsWith('http://') || url.startsWith('https://')
  }
</script>

{#if visibleContacts.length > 0 || visibleCtas.length > 0}
  <div class={twMerge(clsx('flex items-center gap-2', className))}>
    {#each visibleContacts as item (item.key)}
      {@const Icon = item.icon}
      <a
        href={item.url}
        class="inline-flex items-center justify-center size-8 rounded-full bg-pm-brand text-pm-white hover:bg-pm-brand-light active:bg-pm-brand-dark transition-colors duration-150"
        aria-label={item.key}
        target={isExternal(item.url) ? '_blank' : undefined}
        rel={isExternal(item.url) ? 'noopener noreferrer' : undefined}
      >
        <Icon {size} />
      </a>
    {/each}

    {#each visibleCtas as item (item.key)}
      {@const Icon = item.icon}
      <a
        href={item.url}
        class="inline-flex items-center gap-2 px-3 h-8 rounded-full bg-pm-brand text-pm-white text-sm font-medium hover:bg-pm-brand-light transition-colors"
        aria-label={ctaLabel}
        target={isExternal(item.url) ? '_blank' : undefined}
        rel={isExternal(item.url) ? 'noopener noreferrer' : undefined}
      >
        <Icon size={18} />
        <span>{ctaLabel}</span>
      </a>
    {/each}
  </div>
{/if}
