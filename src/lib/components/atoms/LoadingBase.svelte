<script lang="ts">
  interface Props {
    class?: string
    width?: string
    height?: string
    rounded?: string
  }
  let { class: className = '', width = '100%', height = '1em', rounded = 'rounded' }: Props = $props()
</script>

<div
  class="animate-pulse bg-pm-border {rounded} {className}"
  style="width: {width}; height: {height}"
  aria-hidden="true"
  role="presentation"
/>
