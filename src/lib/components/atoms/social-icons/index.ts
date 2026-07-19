/**
 * Social Icon Registry — import all icon atoms here
 * Add new icons by creating a file in this directory and adding it to the map.
 */
import TelegramIcon from './TelegramIcon.svelte'
import GithubIcon from './GithubIcon.svelte'
import InstagramIcon from './InstagramIcon.svelte'
import YoutubeIcon from './YoutubeIcon.svelte'
import VkIcon from './VkIcon.svelte'
import XIcon from './XIcon.svelte'
import LinkedinIcon from './LinkedinIcon.svelte'
import WhatsappIcon from './WhatsappIcon.svelte'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ICON_MAP: Record<string, any> = {
  telegram: TelegramIcon,
  github: GithubIcon,
  instagram: InstagramIcon,
  youtube: YoutubeIcon,
  vk: VkIcon,
  x: XIcon,
  twitter: XIcon,
  linkedin: LinkedinIcon,
  whatsapp: WhatsappIcon
}
