<script lang="ts">
  /**
   * XIcon — X social platform SVG icon (brand glyph)
   *
   * @props size?: number — icon dimension in px (default 20)
   * @props class?: string — merged Tailwind classes
   * @example <TelegramIcon size=24 />
   */
  import BaseIcon from './BaseIcon.svelte'
  let { size = 20, class: className = '' }: { size?: number; class?: string } = $props()
</script>

<BaseIcon {size} class={className}>
  <path d="M4 4l11.733 16h4.267l-11.733 -16z" /><path d="M4 20l6.768 -6.768m2.46 -2.46l2.772 -2.772" />
</BaseIcon>
