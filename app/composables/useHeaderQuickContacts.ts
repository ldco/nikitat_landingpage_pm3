import type { Component } from 'vue'
import { usePmConfig } from '~~/pm-core/app/composables/usePmConfig'

import IconPhone from '~icons/tabler/phone'
import IconMail from '~icons/tabler/mail'
import IconMapPin from '~icons/tabler/map-pin'
import IconMessageCircle from '~icons/tabler/message-circle'
import IconBrandTelegram from '~icons/tabler/brand-telegram'
import IconBrandWhatsapp from '~icons/tabler/brand-whatsapp'
import IconBrandDiscord from '~icons/tabler/brand-discord'
import IconBrandInstagram from '~icons/tabler/brand-instagram'
import IconBrandFacebook from '~icons/tabler/brand-facebook'
import IconBrandYoutube from '~icons/tabler/brand-youtube'
import IconBrandLinkedin from '~icons/tabler/brand-linkedin'
import IconBrandX from '~icons/tabler/brand-x'
import IconBrandGithub from '~icons/tabler/brand-github'
import IconBrandGitlab from '~icons/tabler/brand-gitlab'
import IconBrandVk from '~icons/tabler/brand-vk'
import IconBrandTiktok from '~icons/tabler/brand-tiktok'
import IconBrandPinterest from '~icons/tabler/brand-pinterest'
import IconBrandDribbble from '~icons/tabler/brand-dribbble'
import IconBrandBehance from '~icons/tabler/brand-behance'
import IconBrandMedium from '~icons/tabler/brand-medium'
import IconBrandThreads from '~icons/tabler/brand-threads'
import IconBrandTwitch from '~icons/tabler/brand-twitch'
import IconArrowRight from '~icons/tabler/arrow-right'

import IconMax from '~/assets/icons/custom/IconMax.vue'

export interface HeaderQuickContactOption {
  key: string
  label: string
  icon: Component
  iconName: string
}

const iconMap: Record<string, Component> = {
  'arrow-right': IconArrowRight,
  mail: IconMail,
  phone: IconPhone,
  'map-pin': IconMapPin,
  'brand-telegram': IconBrandTelegram,
  'brand-whatsapp': IconBrandWhatsapp,
  'brand-viber': IconMessageCircle,
  'brand-discord': IconBrandDiscord,
  'brand-instagram': IconBrandInstagram,
  'brand-facebook': IconBrandFacebook,
  'brand-x': IconBrandX,
  'brand-threads': IconBrandThreads,
  'brand-tiktok': IconBrandTiktok,
  'brand-pinterest': IconBrandPinterest,
  'brand-vk': IconBrandVk,
  'brand-youtube': IconBrandYoutube,
  'brand-twitch': IconBrandTwitch,
  'brand-linkedin': IconBrandLinkedin,
  'brand-medium': IconBrandMedium,
  'brand-github': IconBrandGithub,
  'brand-gitlab': IconBrandGitlab,
  'brand-dribbble': IconBrandDribbble,
  'brand-behance': IconBrandBehance,
  'custom-max': IconMax
}

const quickContactKeys = new Set([
  'contact.email',
  'contact.phone',
  'social.telegram',
  'social.whatsapp',
  'social.viber',
  'social.discord',
  'social.max'
])

export const headerCtaOptionKey = 'footer.ctaUrl'

function isHeaderQuickContactSetting(setting: {
  key: string
  type: string
  group: string
  icon?: string
}): boolean {
  if (!setting.icon) return false
  return quickContactKeys.has(setting.key)
}

function isContactInfoSetting(setting: {
  key: string
  type: string
  group: string
  icon?: string
}): boolean {
  if (!setting.icon) return false
  return quickContactKeys.has(setting.key)
}

export function parseHeaderQuickContactItems(value: string | null | undefined): string[] {
  if (!value) return []

  return Array.from(
    new Set(
      value
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)
    )
  )
}

export function serializeHeaderQuickContactItems(items: string[]): string {
  return Array.from(new Set(items.map(item => item.trim()).filter(Boolean))).join(',')
}

export function buildHeaderQuickContactUrl(key: string, value: string): string {
  if (key === headerCtaOptionKey) {
    return value
  }

  if (key === 'contact.phone') {
    return `tel:${value.replace(/\s/g, '')}`
  }

  if (key === 'contact.email') {
    return `mailto:${value}`
  }

  return value
}

function buildContactOption(setting: {
  key: string
  label: string
  icon?: string
}, translate: {
  t: (key: string) => string
  te: (key: string) => boolean
}): HeaderQuickContactOption[] {
  const iconName = setting.icon as string
  const icon = iconMap[iconName]
  if (!icon) {
    return []
  }

  return [{
    key: setting.key,
    label: translate.te(`settings.${setting.key}`) ? translate.t(`settings.${setting.key}`) : setting.label,
    icon,
    iconName
  }]
}

export function useHeaderQuickContactOptions() {
  const config = usePmConfig()
  const { t, te } = useI18n()
  const settingsConfig = computed(() => config.settings ?? [])

  const quickContactOptions = computed<HeaderQuickContactOption[]>(() => {
    return settingsConfig.value.flatMap(setting => {
      if (!isHeaderQuickContactSetting(setting)) {
        return []
      }

      return buildContactOption(setting, { t, te })
    })
  })

  const ctaOption = computed<HeaderQuickContactOption | null>(() => {
    const ctaSetting = settingsConfig.value.find(setting => setting.key === headerCtaOptionKey)
    if (!ctaSetting) return null

    return {
      key: headerCtaOptionKey,
      label: t('cta.primaryButton'),
      icon: IconArrowRight,
      iconName: 'arrow-right'
    }
  })

  const options = computed<HeaderQuickContactOption[]>(() => [
    ...quickContactOptions.value,
    ...(ctaOption.value ? [ctaOption.value] : [])
  ])

  const optionsByKey = computed<Record<string, HeaderQuickContactOption>>(() =>
    Object.fromEntries(options.value.map(option => [option.key, option]))
  )

  return {
    options,
    optionsByKey
  }
}

export function useContactInfoOptions() {
  const config = usePmConfig()
  const { t, te } = useI18n()
  const settingsConfig = computed(() => config.settings ?? [])

  const options = computed<HeaderQuickContactOption[]>(() => {
    return settingsConfig.value.flatMap(setting => {
      if (!isContactInfoSetting(setting)) {
        return []
      }

      return buildContactOption(setting, { t, te })
    })
  })

  const optionsByKey = computed<Record<string, HeaderQuickContactOption>>(() =>
    Object.fromEntries(options.value.map(option => [option.key, option]))
  )

  return {
    options,
    optionsByKey
  }
}
