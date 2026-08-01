<script lang="ts">
  import BaseIcon from './BaseIcon.svelte'
  let { size = 20, class: className = '' }: { size?: number; class?: string } = $props()
</script>

<BaseIcon {size} class={className}>
  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
</BaseIcon>
