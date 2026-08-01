<script lang="ts">
  import LoadingBase from './LoadingBase.svelte'
  import LoadingText from './LoadingText.svelte'
  interface Props { class?: string }
  /**
 * LoadingCard — Card-shaped loading skeleton (PM3 rule 8)
 *
 * @props class?: string — merged Tailwind classes
 * @example <LoadingCard />
 */

let { class: className = '' }: Props = $props()
</script>

<div class="bg-pm-bg-elevated border border-pm-border rounded-xl p-4 {className}" aria-hidden="true">
  <LoadingBase width="100%" height="8rem" rounded="rounded-lg" />
  <div class="mt-3"><LoadingText lines={3} /></div>
</div>
