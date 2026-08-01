<script lang="ts">
  import BaseIcon from './BaseIcon.svelte'
  let { size = 20, class: className = '' }: { size?: number; class?: string } = $props()
</script>

<BaseIcon {size} class={className}>
  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
</BaseIcon>
