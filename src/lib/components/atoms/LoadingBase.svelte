<script lang="ts">
  /**
   * LoadingBase — Skeleton placeholder
   *
   * @props class — merged Tailwind classes
   * @props width — CSS width value (default 100%)
   * @props height — CSS height value (default 1em)
   * @props rounded — border-radius class (default rounded)
   *
   * @example
   * <LoadingBase width="100%" height="1.5rem" />
   */
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
></div>
