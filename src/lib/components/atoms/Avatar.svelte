<script lang="ts">
  /**
   * Avatar — User/logo image with fallback initials
   *
   * Source: app-nuxt/app/assets/css/ui/content/avatars.css (66 lines)
   * 5 sizes: xs (24px), sm (32px), md (40px), lg (56px), xl (80px)
   *
   * Rule #1: class prop + twMerge
   *
   * @props {string} [src] — image URL; fallback initials rendered when absent
   * @props {string} [alt=''] — image alt text
   * @props {'xs'|'sm'|'md'|'lg'|'xl'} [size='md'] — avatar size
   * @props {string} [class] — additional CSS classes merged via twMerge
   * @props {Snippet} children — fallback content (e.g. initials) when no src
   *
   * @example
   * <Avatar src={user.avatarUrl} alt={user.name} size="lg" />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

  let {
    src,
    alt = '',
    size = 'md',
    class: className = '',
    children
  }: {
    src?: string
    alt?: string
    size?: Size
    class?: string
    children?: import('svelte').Snippet
  } = $props()

  const sizes: Record<Size, string> = {
    xs: 'size-6 text-xs',
    sm: 'size-8 text-xs',
    md: 'size-10 text-sm',
    lg: 'size-14 text-lg',
    xl: 'size-20 text-2xl'
  }

  const base =
    'inline-flex items-center justify-center rounded-full ' +
    'bg-pm-brand-subtle text-pm-brand font-semibold ' +
    'overflow-hidden flex-shrink-0'

  const merged = $derived(twMerge(clsx(base, sizes[size], className)))
</script>

{#if src}
  <span class={merged}>
    <img {src} {alt} class="w-full h-full object-cover" />
  </span>
{:else}
  <span class={merged}>
    {@render children?.()}
  </span>
{/if}
