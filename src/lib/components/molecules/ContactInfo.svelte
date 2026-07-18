<script lang="ts">
  /**
   * ContactInfo — Email/phone/address display from settings
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

  const base = 'flex flex-col gap-3 text-sm'
  const itemClass = 'flex items-center gap-2 text-pm-gray-600 dark:text-pm-gray-400'
  const linkClass = 'text-pm-brand hover:text-pm-brand-light transition-colors'
</script>

<div class={twMerge(clsx(base, className))}>
  {#if email}
    <div class={itemClass}>
      <svg class="w-4 h-4 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
      <a href={`mailto:${email}`} class={linkClass}>{email}</a>
    </div>
  {/if}

  {#if phone}
    <div class={itemClass}>
      <svg class="w-4 h-4 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
      <a href={`tel:${phone}`} class={linkClass}>{phone}</a>
    </div>
  {/if}

  {#if address}
    <div class={itemClass}>
      <svg class="w-4 h-4 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
      <span>{address}</span>
    </div>
  {/if}

  {#if workingHours}
    <div class={itemClass}>
      <svg class="w-4 h-4 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
      <span>{workingHours}</span>
    </div>
  {/if}
</div>
