<script lang="ts">
  /**
   * VkIcon — Vk social platform SVG icon (brand glyph)
   *
   * @props size?: number — icon dimension in px (default 20)
   * @props class?: string — merged Tailwind classes
   * @example <TelegramIcon size=24 />
   */
  import BaseIcon from './BaseIcon.svelte'
  let { size = 20, class: className = '' }: { size?: number; class?: string } = $props()
</script>

<BaseIcon {size} class={className}>
  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm5.15 13.95h-1.88c-.66 0-.86-.51-2.04-1.67-1.03-1.01-1.49-1.14-1.74-1.14-.36 0-.46.14-.46.56v1.48c0 .38-.12.6-1.11.6-1.64 0-3.45-1-4.72-2.86-1.8-2.57-2.29-4.48-2.29-4.88 0-.2.1-.38.4-.38h1.87c.38 0 .52.17.66.56.73 1.9 1.95 3.56 2.45 3.56.19 0 .23-.08.23-.27v-2.14c0-.97-.57-1.06-.57-1.42 0-.17.13-.32.36-.32h2.92c.3 0 .42.16.42.51v2.73c0 .3.13.4.21.4.17 0 .35-.14.65-.44 1.1-1.13 1.65-2.54 1.65-2.54.1-.2.27-.33.58-.33h1.87c.4 0 .49.2.4.48-.17.79-2.1 3.02-2.1 3.02-.17.23-.22.34 0 .6.15.2.66.64 1.02 1.04.61.7.95 1.23 1.04 1.7.08.46-.37.66-.74.66z" />
</BaseIcon>
