<script lang="ts">
  /**
   * SocialNav — Social media links from settings
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import SocialIcon from '$lib/components/atoms/SocialIcon.svelte'

  let {
    class: className = ''
  }: {
    class?: string
  } = $props()

  // Social platforms will be loaded from DB settings at runtime
  const base = 'flex items-center gap-2'
</script>

<div class={twMerge(clsx(base, className))}>
  <SocialIcon platform="github" url="https://github.com" />
  <SocialIcon platform="telegram" url="https://t.me" />
</div>
