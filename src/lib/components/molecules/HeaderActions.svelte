<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { FEATURES } from '$lib/config/site'
  import ThemeToggle from '$lib/components/atoms/ThemeToggle.svelte'
  import LangSwitcher from '$lib/components/atoms/LangSwitcher.svelte'
  import HeaderContact from '$lib/components/molecules/HeaderContact.svelte'

  /**
 * HeaderActions — Header action rail: theme toggle + language switcher + quick contact
 *
 * @props showContact?: boolean — show HeaderContact (default true)
 * @props langDirection?: 'down' | 'side' | 'inline' — LangSwitcher layout
 * @props class?: string — merged Tailwind classes
 * @example <HeaderActions langDirection="down" />
 */

let {
    showContact = true,
    langDirection = "down",
    class: className = ""
  }: { showContact?: boolean; langDirection?: "down" | "side" | "inline"; class?: string } = $props()

  const showTheme = $derived(FEATURES.doubleTheme)
  const showLang = $derived(FEATURES.multiLangs)
</script>

<div class={twMerge(clsx("header-actions-rail flex items-center gap-2", className))}>
  {#if showContact}
    <HeaderContact mode="contacts" />
  {/if}
  {#if showTheme}
    <ThemeToggle />
  {/if}
  {#if showLang}
    <div class="header-actions-lang"><LangSwitcher mode={langDirection} /></div>
  {/if}
</div>
