<script lang="ts">
  import BaseIcon from './BaseIcon.svelte'
  let { size = 20, class: className = '' }: { size?: number; class?: string } = $props()
</script>

<BaseIcon {size} class={className}>
  <path d="M21.198 2.433a2.242 2.242 0 0 0-1.022.215l-17.5 7.75A2.188 2.188 0 0 0 2.39 12.9a2.144 2.144 0 0 0 1.154.312h3.316v2.85a1.574 1.574 0 0 0 1.574 1.574h.012a.388.388 0 0 0 .234-.094l3.066-2.672 2.984 2.18a1.074 1.074 0 0 0 .676.234.54.54 0 0 0 .314-.105 2.062 2.062 0 0 0 .918-1.371l3.035-14.67a1.49 1.49 0 0 0-.296-1.24 2.053 2.053 0 0 0-1.095-.672Z" />
</BaseIcon>
