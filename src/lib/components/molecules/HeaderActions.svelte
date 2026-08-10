<script lang="ts">
  /**
   * HeaderActions — Header action rail: theme toggle + language switcher + quick contact
   *
   * Contact icons are configured in the admin settings panel (not hardcoded).
   *
   * @props showContact?: boolean — show HeaderContact (default true)
   * @props langDirection?: 'down' | 'side' | 'inline' — LangSwitcher layout
   * @props class?: string — merged Tailwind classes
   * @example <HeaderActions langDirection="down" />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { FEATURES } from '$lib/config/site'
  import ThemeToggle from '$lib/components/atoms/ThemeToggle.svelte'
  import LangSwitcher from '$lib/components/atoms/LangSwitcher.svelte'
  import HeaderContact from '$lib/components/molecules/HeaderContact.svelte'

  let {
    showContact = false,
    langDirection = 'down',
    class: className = ''
  }: {
    showContact?: boolean
    langDirection?: 'down' | 'side' | 'inline'
    class?: string
  } = $props()

  const showTheme = $derived(FEATURES.doubleTheme)
  const showLang = $derived(FEATURES.multiLangs)
</script>

<div class={twMerge(clsx('flex items-center gap-2', className))}>
  {#if showContact}
    <HeaderContact />
  {/if}
  {#if showTheme}
    <ThemeToggle />
  {/if}
  {#if showLang}
    <LangSwitcher mode={langDirection} />
  {/if}
</div>
