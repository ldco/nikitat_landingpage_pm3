<script lang="ts">
  /**
   * AdminNavItem — shared navigation anchor for the admin shell.
   *
   * Renders one nav link in the three admin-shell breakpoint layouts:
   *   - `rail`   — desktop vertical sidebar: icon-only, tooltip on the side
   *   - `header` — desktop horizontal header: icon-only, tooltip below
   *   - `tablet` — tablet icon rail: icon + label stacked, no tooltip
   * The unread badge (contacts only) renders for `rail`/`tablet` variants.
   *
   * @props {string} href — destination URL
   * @props {boolean} active — active-state styling
   * @props {string} label — resolved nav label (tooltip / tablet label)
   * @props {ComponentType} [icon] — icon component (IconSettings fallback)
   * @props {number} [badge=0] — unread badge count (rendered when > 0)
   * @props {'rail'|'header'|'tablet'} [variant='rail'] — layout variant
   * @props {string} [class] — additional CSS classes merged via twMerge
   *
   * @example
   * <AdminNavItem href="/admin/users" active={isActive('users')} label={label} icon={icon} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import type { ComponentType } from 'svelte'
  import IconSettings from '@tabler/icons-svelte/icons/settings'

  export type AdminNavItemVariant = 'rail' | 'header' | 'tablet'

  let {
    href,
    active = false,
    label,
    icon,
    badge = 0,
    variant = 'rail',
    class: className = ''
  }: {
    href: string
    active?: boolean
    label: string
    icon?: ComponentType
    badge?: number
    variant?: AdminNavItemVariant
    class?: string
  } = $props()

  const ItemIcon = $derived(icon ?? IconSettings)
  const showBadge = $derived(badge > 0)
</script>

<a
  {href}
  aria-label={label}
  class={twMerge(
    clsx(
      'relative flex transition-colors group',
      variant === 'tablet'
        ? 'flex-col items-center justify-center gap-0.5 size-16 rounded-md'
        : 'items-center justify-center rounded-[var(--radius-md)]',
      variant === 'rail' ? 'size-10' : '',
      variant === 'header' ? 'size-11' : '',
      active
        ? 'bg-pm-brand-subtle text-pm-brand-text'
        : 'text-pm-text-secondary hover:text-pm-text hover:bg-pm-bg-sunken',
      className
    )
  )}
>
  <ItemIcon class="size-5" />
  {#if variant === 'tablet'}
    <span
      class={clsx(
        'text-[var(--text-2xs)] truncate max-w-16 px-1 text-center',
        active ? 'text-pm-brand-text' : 'text-pm-text-muted group-hover:text-pm-text'
      )}
    >
      {label}
    </span>
  {/if}
  {#if showBadge}
    <span
      class={clsx(
        'flex items-center justify-center min-w-3.5 h-3.5 px-1 rounded-full bg-pm-danger text-[var(--text-2xs)] font-bold text-white leading-none',
        variant === 'rail' ? 'absolute -top-0.5 -end-0.5' : 'absolute top-1 end-2'
      )}
    >
      {badge > 9 ? '9+' : badge}
    </span>
  {/if}
  {#if variant !== 'tablet'}
    <!-- Tooltip -->
    <span
      class={clsx(
        'absolute px-2 py-1 rounded-md bg-pm-bg-elevated border border-pm-border text-xs text-pm-text shadow-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-[var(--z-tooltip)]',
        variant === 'rail' ? 'start-full ms-2' : 'top-full mt-2'
      )}
    >
      {label}
    </span>
  {/if}
</a>
