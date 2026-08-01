<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { FEATURES } from '$lib/config/site'
  import ThemeToggle from '$lib/components/atoms/ThemeToggle.svelte'
  import LangSwitcher from '$lib/components/atoms/LangSwitcher.svelte'
  import BrandTelegram from '@tabler/icons-svelte/icons/brand-telegram'
  import IconMail from '@tabler/icons-svelte/icons/mail'

  let {
    showContact = true,
    langDirection = "down",
    class: className = ""
  }: { showContact?: boolean; langDirection?: "down" | "side" | "inline"; class?: string } = $props()

  const showTheme = $derived(FEATURES.doubleTheme)
  const showLang = $derived(FEATURES.multiLangs)
</script>

<div class={twMerge(clsx("header-contact flex items-center gap-2", className))}>
  {#if showContact}
    <a href="@ldandco" class="header-contact-btn action-surface action-surface--brand inline-flex items-center justify-center size-9 rounded-md text-pm-text-secondary hover:text-pm-text hover:bg-pm-bg-sunken transition-colors" aria-label="Telegram">
      <BrandTelegram class="size-5" />
    </a>
    <a href="mailto:ldcodesign@yandex.ru" class="header-contact-btn action-surface action-surface--brand inline-flex items-center justify-center size-9 rounded-md text-pm-text-secondary hover:text-pm-text hover:bg-pm-bg-sunken transition-colors" aria-label="Email">
      <IconMail class="size-5" />
    </a>
  {/if}
  {#if showTheme}
    <ThemeToggle />
  {/if}
  {#if showLang}
    <div class="header-actions-lang"><LangSwitcher mode={langDirection} /></div>
  {/if}
</div>