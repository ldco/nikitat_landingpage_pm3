<script lang="ts">
  /**
   * SocialIcon — Renders the correct social icon from social-icons/ subfolder
   *
   * Icons are in src/lib/components/atoms/social-icons/ — one file per platform.
   * All share BaseIcon.svelte for common SVG attributes (stroke, viewBox, etc.).
   * To add a platform: create IconName.svelte and add an {:else if} chain here.
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import TelegramIcon from './social-icons/TelegramIcon.svelte'
  import GithubIcon from './social-icons/GithubIcon.svelte'
  import InstagramIcon from './social-icons/InstagramIcon.svelte'
  import YoutubeIcon from './social-icons/YoutubeIcon.svelte'
  import VkIcon from './social-icons/VkIcon.svelte'
  import XIcon from './social-icons/XIcon.svelte'
  import LinkedinIcon from './social-icons/LinkedinIcon.svelte'
  import WhatsappIcon from './social-icons/WhatsappIcon.svelte'

  let {
    platform,
    url,
    size = 20,
    label,
    class: className = ''
  }: {
    platform: string
    url: string
    size?: number
    label?: string
    class?: string
  } = $props()

  const base = 'inline-flex items-center justify-center text-pm-text-muted hover:text-pm-brand transition-colors duration-150'
</script>

<a href={url} target="_blank" rel="noopener noreferrer"
   class={twMerge(clsx(base, className))}
   aria-label={label ?? platform}>
  <span class="sr-only">{label ?? platform}</span>
  {#if platform.toLowerCase() === 'telegram'}
    <TelegramIcon {size} />
  {:else if platform.toLowerCase() === 'github'}
    <GithubIcon {size} />
  {:else if platform.toLowerCase() === 'instagram'}
    <InstagramIcon {size} />
  {:else if platform.toLowerCase() === 'youtube'}
    <YoutubeIcon {size} />
  {:else if platform.toLowerCase() === 'vk'}
    <VkIcon {size} />
  {:else if platform.toLowerCase() === 'x' || platform.toLowerCase() === 'twitter'}
    <XIcon {size} />
  {:else if platform.toLowerCase() === 'linkedin'}
    <LinkedinIcon {size} />
  {:else if platform.toLowerCase() === 'whatsapp'}
    <WhatsappIcon {size} />
  {:else}
    <!-- Fallback: generic link icon for unknown platforms -->
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  {/if}
</a>
