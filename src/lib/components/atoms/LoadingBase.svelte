<script lang="ts">
  /**
 * LoadingBase — Skeleton placeholder base (PM3 rule 8)
 *
 * @props class?: string — merged Tailwind classes
 * @props width?: string — CSS width (default '100%')
 * @props height?: string — CSS height (default '1em')
 * @props rounded?: string — border-radius class (default 'rounded')
 * @example <LoadingBase height="1.5em" class="w-24" />
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
/>
