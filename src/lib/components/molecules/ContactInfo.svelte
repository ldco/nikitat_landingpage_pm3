<script lang="ts">
  /**
   * ContactInfo — Contact details with icons (PM v2 design)
   *
   * Source: app-nuxt/app/assets/css/ui/content/contact-info.css (158 lines)
   * - .contact-info: vertical flex with gap-md
   * - .contact-info-item: horizontal flex with icon + value, elevated bg
   * - .contact-info-item:hover: brand background, white text
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  let {
    email = '',
    phone = '',
    address = '',
    workingHours = '',
    class: className = ''
  }: {
    email?: string
    phone?: string
    address?: string
    workingHours?: string
    class?: string
  } = $props()

  const base = 'flex flex-col gap-4'

  // .contact-info-item: elevated bg, rounded-lg
  const itemBase =
    'flex items-center gap-3 px-4 py-3 rounded-lg ' +
    'bg-pm-bg-elevated border border-pm-border ' +
    'transition-all duration-150'

  const iconClass = 'size-5 text-pm-brand flex-shrink-0 transition-colors duration-150'

  // .contact-info-value: text-secondary, text-base
  const valueClass = 'text-base text-pm-text-secondary min-w-0'

  // .contact-info-item--link: hover brand bg
  const linkClass = clsx(itemBase,
    'cursor-pointer hover:bg-pm-brand hover:border-pm-brand',
    'hover:[&_svg]:text-pm-white',
    'hover:[&_span]:text-pm-white'
  )
</script>

<div class={twMerge(clsx(base, className))}>
  {#if email}
    <a href={`mailto:${email}`} class={linkClass}>
      <svg class={iconClass} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
      <span class={valueClass}>{email}</span>
    </a>
  {/if}

  {#if phone}
    <a href={`tel:${phone}`} class={linkClass}>
      <svg class={iconClass} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
      <span class={valueClass}>{phone}</span>
    </a>
  {/if}

  {#if address}
    <div class={itemBase}>
      <svg class={iconClass} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
      <span class={valueClass}>{address}</span>
    </div>
  {/if}

  {#if workingHours}
    <div class={itemBase}>
      <svg class={iconClass} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span class={valueClass}>{workingHours}</span>
    </div>
  {/if}
</div>
