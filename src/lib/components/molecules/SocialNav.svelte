<script lang="ts">
  /**
   * SocialNav — Dynamic social links from DB settings
   *
   * Renders social platform icons based on settings table entries.
   * Only platforms with non-empty values render, and only from the "Social
   * Networks" admin section (settings group 'social') — the messaging
   * platforms (Telegram, WhatsApp, Viber, Discord, MAX — group 'contact')
   * are contact-page concerns and never appear in the footer.
   * Icons are loaded from the social-icons registry (add/remove platforms there).
   *
   * Data: loaded client-side from /api/settings endpoint.
   *
   * Rule #1: class prop + twMerge
   *
   * @props {'default'|'filled'|'bordered'|'circle'} [variant='default'] — icon style variant
   * @props {'sm'|'md'|'lg'} [size='md'] — link size
   * @props {string} [class] — additional CSS classes merged via twMerge
   *
   * @example
   * <SocialNav variant="circle" size="sm" />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import SocialIcon from '$lib/components/atoms/SocialIcon.svelte'
  import { useSettings } from '$lib/stores/settings.svelte'
  import { SETTINGS_SCHEMA } from '$lib/config/settings-schema'

  type Size = 'sm' | 'md' | 'lg'
  type Variant = 'default' | 'filled' | 'bordered' | 'circle'

  let {
    variant = 'default',
    size = 'md',
    class: className = ''
  }: {
    variant?: Variant
    size?: Size
    class?: string
  } = $props()

  const linkSizes: Record<Size, string> = {
    sm: 'size-7',
    md: 'size-9',
    lg: 'size-11'
  }

  const iconSizes: Record<Size, number> = {
    sm: 18,
    md: 20,
    lg: 24
  }

  const variantStyles: Record<Variant, string> = {
    default: '',
    filled: 'bg-pm-bg-sunken hover:bg-pm-brand-subtle',
    bordered: 'border border-pm-border hover:border-pm-brand',
    circle: 'bg-pm-brand-subtle text-pm-brand-text hover:bg-pm-brand hover:text-pm-white rounded-full'
  }

  const linkBase =
    'inline-flex items-center justify-center rounded-full transition-all duration-150 text-pm-text-muted hover:text-pm-text ' +
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pm-focus-ring'

  // ── Load social links from DB settings ────────────────────────────────────
  // Settings key pattern: social.{platform}
  // e.g. social.telegram, social.github, social.instagram
  interface SocialLink {
    platform: string
    url: string
  }

  const settings = useSettings()

  // Footer socials = the "Social Networks" admin section (settings group
  // 'social'). The schema is the single source of truth for which platforms
  // belong there, so the footer can never drift from the admin UI.
  const FOOTER_PLATFORMS = new Set(
    SETTINGS_SCHEMA.filter(s => s.group === 'social').map(s => s.key.split('.')[1])
  )

  // Reactive social links from shared settings store (rule 6: no direct API fetch).
  // Only non-empty values from the Social Networks section render.
  const socialLinks = $derived.by(() =>
    settings.socialLinks
      .filter(link => FOOTER_PLATFORMS.has(link.platform))
      .map(link => ({ platform: link.platform, url: link.url }))
  )
</script>

{#if socialLinks.length > 0}
  <div class={twMerge(clsx('flex flex-wrap items-center gap-0.5', className))}>
    {#each socialLinks as link (link.platform)}
      <span class={twMerge(clsx(linkBase, linkSizes[size], variantStyles[variant]))}>
        <SocialIcon platform={link.platform} url={link.url} size={iconSizes[size]} />
      </span>
    {/each}
  </div>
{/if}
