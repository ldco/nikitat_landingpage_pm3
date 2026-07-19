<script lang="ts">
  import BaseIcon from './BaseIcon.svelte'
  let { size = 20 }: { size?: number } = $props()
</script>

<BaseIcon {size}>
  <path d="M4 4l11.733 16h4.267l-11.733 -16z" /><path d="M4 20l6.768 -6.768m2.46 -2.46l2.772 -2.772" />
</BaseIcon>
