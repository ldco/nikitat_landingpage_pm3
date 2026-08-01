<script lang="ts">
  /**
   * SocialIcon — platform icon using Tabler brand icons
   * PM v2 parity: flexibile platform handling via lookup map
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
  import IconWorld from '@tabler/icons-svelte/icons/world'

  interface Props {
    platform: string
    url: string
    size?: number
    class?: string
  }

  let { platform, url, size = 20, class: className = '' }: Props = $props()

  const base = 'inline-flex items-center justify-center transition-opacity hover:opacity-80'
  const key = platform.toLowerCase()

  const ICONS: Record<string, typeof BrandTelegram> = {
    telegram: BrandTelegram,
    github: BrandGithub,
    instagram: BrandInstagram,
    youtube: BrandYoutube,
    vk: BrandVk,
    x: BrandTwitter,
    twitter: BrandTwitter,
    linkedin: BrandLinkedin,
    whatsapp: BrandWhatsapp,
    facebook: BrandFacebook
  }

  const Icon = $derived(ICONS[key] ?? IconWorld)
</script>

<a href={url} target="_blank" rel="noopener noreferrer" class={twMerge(clsx(base, className))}>
  <Icon {size} />
</a>
