<script lang="ts">
  import LoadingBase from './LoadingBase.svelte'
  interface Props { lines?: number; class?: string }
  /**
 * LoadingText — Text-line loading skeleton (PM3 rule 8)
 *
 * @props lines?: number — number of skeleton lines (default 1)
 * @props class?: string — merged Tailwind classes
 * @example <LoadingText lines={2} />
 */

let { lines = 3, class: className = '' }: Props = $props()
</script>

<div class="space-y-2 {className}" aria-hidden="true">
  {#each Array(lines) as _, i}
    <LoadingBase width={i === lines - 1 ? '60%' : '100%'} height="0.75em" rounded="rounded" />
  {/each}
</div>
