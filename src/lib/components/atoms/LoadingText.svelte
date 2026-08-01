<script lang="ts">
  import LoadingBase from './LoadingBase.svelte'
  interface Props { lines?: number; class?: string }
  let { lines = 3, class: className = '' }: Props = $props()
</script>

<div class="space-y-2 {className}" aria-hidden="true">
  {#each Array(lines) as _, i}
    <LoadingBase width={i === lines - 1 ? '60%' : '100%'} height="0.75em" rounded="rounded" />
  {/each}
</div>
