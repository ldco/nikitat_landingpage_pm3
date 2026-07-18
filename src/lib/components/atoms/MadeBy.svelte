<script lang="ts">
  /**
   * MadeBy — Developer/project attribution with light/dark logos
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as runtime from '$lib/paraglide/runtime.js'

  let {
    text = 'Made by',
    url = 'https://fabrica22.pro',
    basePath = '/madebylogos',
    class: className = ''
  }: {
    text?: string
    url?: string
    basePath?: string
    class?: string
  } = $props()

  const theme = $derived('dark') // Will be connected to theme store later
  const lang = $derived(runtime.languageTag() ?? 'en')
  const langFallback: Record<string, string> = { en: 'en', fr: 'en', he: 'en' }
  const resolvedLang = $derived(langFallback[lang] ?? 'en')

  // Determine which logo to show based on theme
  const logoSrc = $derived(`${basePath}/horizontal_${theme}_${resolvedLang}.svg`)

  const base = 'inline-flex items-center gap-2 text-sm text-pm-muted dark:text-pm-muted-dark'
</script>

<div class={twMerge(clsx(base, className))}>
  <span>{text}</span>
  <a href={url} target="_blank" rel="noopener noreferrer" class="opacity-80 hover:opacity-100 transition-opacity">
    <img src={logoSrc} alt="Fabrica 22" class="h-5 w-auto" />
  </a>
</div>
