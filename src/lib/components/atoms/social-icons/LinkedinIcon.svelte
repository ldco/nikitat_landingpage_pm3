<script lang="ts">
  import BaseIcon from './BaseIcon.svelte'
  let { size = 20, class: className = '' }: { size?: number; class?: string } = $props()
</script>

<BaseIcon {size} class={className}>
  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" />
</BaseIcon>
