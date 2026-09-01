<script lang="ts">
  /**
   * SocialIcon — platform icon using Tabler brand icons
   * PM v2 parity: flexibile platform handling via lookup map
   *
   * @props {string} platform — platform key (telegram, github, x, ...)
   * @props {string} url — link target
   * @props {number} [size=20] — icon size in pixels
   * @props {string} [class] — additional CSS classes merged via twMerge
   *
   * @example
   * <SocialIcon platform="telegram" url="https://t.me/example" />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import BrandTelegram from '@tabler/icons-svelte/icons/brand-telegram'
  import BrandGithub from '@tabler/icons-svelte/icons/brand-github'
  import BrandInstagram from '@tabler/icons-svelte/icons/brand-instagram'
  import BrandYoutube from '@tabler/icons-svelte/icons/brand-youtube'
  import BrandVk from '@tabler/icons-svelte/icons/brand-vk'
  import BrandTwitter from '@tabler/icons-svelte/icons/brand-twitter'
  import BrandLinkedin from '@tabler/icons-svelte/icons/brand-linkedin'
  import BrandWhatsapp from '@tabler/icons-svelte/icons/brand-whatsapp'
  import BrandFacebook from '@tabler/icons-svelte/icons/brand-facebook'
  import BrandDiscord from '@tabler/icons-svelte/icons/brand-discord'
  import BrandX from '@tabler/icons-svelte/icons/brand-x'
  import BrandThreads from '@tabler/icons-svelte/icons/brand-threads'
  import BrandTiktok from '@tabler/icons-svelte/icons/brand-tiktok'
  import BrandPinterest from '@tabler/icons-svelte/icons/brand-pinterest'
  import BrandTwitch from '@tabler/icons-svelte/icons/brand-twitch'
  import BrandMedium from '@tabler/icons-svelte/icons/brand-medium'
  import BrandGitlab from '@tabler/icons-svelte/icons/brand-gitlab'
  import BrandDribbble from '@tabler/icons-svelte/icons/brand-dribbble'
  import BrandBehance from '@tabler/icons-svelte/icons/brand-behance'
  import IconMessageCircle from '@tabler/icons-svelte/icons/message-circle'
  import IconWorld from '@tabler/icons-svelte/icons/world'

  interface Props {
    platform: string
    url: string
    size?: number
    class?: string
  }

  let { platform, url, size = 20, class: className = '' }: Props = $props()

  const base = 'inline-flex items-center justify-center transition-opacity hover:opacity-80'
  const key = $derived(platform.toLowerCase())

  const ICONS: Record<string, typeof BrandTelegram> = {
    telegram: BrandTelegram,
    telegramchannel: BrandTelegram,
    github: BrandGithub,
    gitlab: BrandGitlab,
    instagram: BrandInstagram,
    youtube: BrandYoutube,
    vk: BrandVk,
    x: BrandX,
    twitter: BrandTwitter,
    threads: BrandThreads,
    tiktok: BrandTiktok,
    pinterest: BrandPinterest,
    twitch: BrandTwitch,
    medium: BrandMedium,
    dribbble: BrandDribbble,
    behance: BrandBehance,
    linkedin: BrandLinkedin,
    whatsapp: BrandWhatsapp,
    facebook: BrandFacebook,
    discord: BrandDiscord,
    discordserver: BrandDiscord,
    viber: IconMessageCircle,
    max: IconMessageCircle,
    maxchannel: IconMessageCircle
  }

  const Icon = $derived(ICONS[key] ?? IconWorld)
</script>

<a href={url} target="_blank" rel="noopener noreferrer" class={twMerge(clsx(base, className))}>
  <Icon {size} />
</a>
