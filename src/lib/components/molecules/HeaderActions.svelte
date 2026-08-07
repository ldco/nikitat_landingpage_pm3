<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { FEATURES } from '$lib/config/site'
  import ThemeToggle from '$lib/components/atoms/ThemeToggle.svelte'
  import LangSwitcher from '$lib/components/atoms/LangSwitcher.svelte'
  import IconMail from '@tabler/icons-svelte/icons/mail'
  import IconSend from '@tabler/icons-svelte/icons/send'
  import { useSettings } from '$lib/stores/settings.svelte'

  /**
   * HeaderActions — Right cluster: Telegram circle, Mail circle,
   * ThemeToggle (sun), LangSwitcher (RU).
   *
   * Telegram and Mail are static rust-filled circles — not the
   * dynamic HeaderContact component.
   *
   * @props langDirection?: 'down' | 'side' | 'inline' — LangSwitcher layout
   * @props class?: string — merged Tailwind classes
   * @example <HeaderActions langDirection="down" />
   */
  let {
    langDirection = 'down',
    class: className = ''
  }: {
    langDirection?: 'down' | 'side' | 'inline'
    class?: string
  } = $props()

  const showTheme = $derived(FEATURES.doubleTheme)
  const showLang = $derived(FEATURES.multiLangs)

  const settings = useSettings()
  const telegramUrl = $derived.by(() => {
    const u = settings.get('social.telegram')
    return u ? `https://t.me/${u.replace('@', '')}` : null
  })
  const mailUrl = $derived.by(() => {
    const email = settings.contactEmail
    return email ? `mailto:${email}` : null
  })
</script>

<div class={twMerge(clsx('flex items-center gap-3', className))}>
  {#if telegramUrl}
    <a href={telegramUrl} target="_blank" rel="noopener noreferrer"
      class="inline-flex items-center justify-center size-8 rounded-full bg-[#A03420] text-[#F5ECDF] hover:bg-[#8A2C1A] transition-colors"
      aria-label="Telegram">
      <IconSend size={16} />
    </a>
  {/if}
  {#if mailUrl}
    <a href={mailUrl}
      class="inline-flex items-center justify-center size-8 rounded-full bg-[#A03420] text-[#F5ECDF] hover:bg-[#8A2C1A] transition-colors"
      aria-label="Email">
      <IconMail size={16} />
    </a>
  {/if}
  {#if showTheme}
    <ThemeToggle />
  {/if}
  {#if showLang}
    <LangSwitcher mode={langDirection} />
  {/if}
</div>
