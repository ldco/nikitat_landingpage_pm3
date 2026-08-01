<script lang="ts">
  import LoadingBase from './LoadingBase.svelte'
  interface Props { rows?: number; columns?: number; class?: string }
  let { rows = 5, columns = 4, class: className = '' }: Props = $props()
</script>

<div class="space-y-3 {className}" aria-hidden="true">
  <!-- Header row -->
  <div class="flex gap-4">
    {#each Array(columns) as _, ci}
      <LoadingBase width="100%" height="1em" rounded="rounded" />
    {/each}
  </div>
  <!-- Data rows -->
  {#each Array(rows) as _, ri}
    <div class="flex gap-4">
      {#each Array(columns) as _, ci}
        <LoadingBase width="100%" height="0.75em" rounded="rounded" />
      {/each}
    </div>
  {/each}
</div>
