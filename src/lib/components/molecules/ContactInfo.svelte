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
   *
   * @props {string} [email=''] — contact email (mailto link)
   * @props {string} [phone=''] — contact phone (tel link)
   * @props {string} [address=''] — physical address
   * @props {string} [workingHours=''] — working hours text
   * @props {string} [class] — additional CSS classes merged via twMerge
   *
   * @example
   * <ContactInfo email="info@example.com" phone="+71234567890" />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import IconMail from '@tabler/icons-svelte/icons/mail'
  import IconPhone from '@tabler/icons-svelte/icons/phone'
  import IconMapPin from '@tabler/icons-svelte/icons/map-pin'
  import IconClock from '@tabler/icons-svelte/icons/clock'

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
      <IconMail class={iconClass} />
      <span class={valueClass}>{email}</span>
    </a>
  {/if}

  {#if phone}
    <a href={`tel:${phone}`} class={linkClass}>
      <IconPhone class={iconClass} />
      <span class={valueClass}>{phone}</span>
    </a>
  {/if}

  {#if address}
    <div class={itemBase}>
      <IconMapPin class={iconClass} />
      <span class={valueClass}>{address}</span>
    </div>
  {/if}

  {#if workingHours}
    <div class={itemBase}>
      <IconClock class={iconClass} />
      <span class={valueClass}>{workingHours}</span>
    </div>
  {/if}
</div>
