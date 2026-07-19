<script lang="ts">
  /**
   * SocialNav — Social media links (PM v2 social-nav.css design)
   *
   * Source: app-nuxt/app/assets/css/skeleton/social-nav.css (114 lines)
   * Variants: default, filled, bordered, circle
   * Sizes: sm, md, lg
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import SocialIcon from '$lib/components/atoms/SocialIcon.svelte'

  type Variant = 'default' | 'filled' | 'bordered' | 'circle'
  type Size = 'sm' | 'md' | 'lg'

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
    lg: 'size-[44px]'
  }

  const iconSizes: Record<Size, number> = {
    sm: 18,
    md: 20,
    lg: 24
  }

  const variantStyles: Record<Variant, string> = {
    default: 'text-pm-text-muted hover:text-pm-text',
    filled: 'bg-pm-bg-sunken text-pm-text-muted hover:bg-pm-brand-subtle hover:text-pm-text',
    bordered: 'border border-pm-border text-pm-text-muted hover:border-pm-brand hover:text-pm-text',
    circle: 'bg-pm-brand-subtle text-pm-brand hover:bg-pm-brand hover:text-pm-white rounded-full'
  }

  const linkBase = 'inline-flex items-center justify-center rounded-full transition-all duration-150 ' +
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pm-focus-ring'

  const merged = $derived(twMerge(clsx('flex flex-wrap items-center gap-0.5', className)))
</script>

<div class={merged}>
  <a href="https://github.com" target="_blank" rel="noopener noreferrer"
     class={twMerge(clsx(linkBase, linkSizes[size], variantStyles[variant]))}
     aria-label="GitHub">
    <svg width={iconSizes[size]} height={iconSizes[size]} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="flex-shrink-0">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
    </svg>
  </a>
  <a href="https://t.me" target="_blank" rel="noopener noreferrer"
     class={twMerge(clsx(linkBase, linkSizes[size], variantStyles[variant]))}
     aria-label="Telegram">
    <svg width={iconSizes[size]} height={iconSizes[size]} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="flex-shrink-0">
      <path d="M21.198 2.433a2.242 2.242 0 0 0-1.022.215l-17.5 7.75A2.188 2.188 0 0 0 2.39 12.9a2.144 2.144 0 0 0 1.154.312h3.316v2.85a1.574 1.574 0 0 0 1.574 1.574h.012a.388.388 0 0 0 .234-.094l3.066-2.672 2.984 2.18a1.074 1.074 0 0 0 .676.234.54.54 0 0 0 .314-.105 2.062 2.062 0 0 0 .918-1.371l3.035-14.67a1.49 1.49 0 0 0-.296-1.24 2.053 2.053 0 0 0-1.095-.672Z" />
    </svg>
  </a>
</div>
