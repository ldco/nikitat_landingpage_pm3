<script lang="ts">
  import OverlayProvider from '$lib/components/complex/OverlayProvider.svelte'
  import FileUpload from '$lib/components/molecules/FileUpload.svelte'

  let {
    value = '',
    removeConfirmTitle = '',
    removeConfirmMessage = '',
    removeConfirmConfirm = '',
    removeConfirmCancel = ''
  }: {
    value?: string
    removeConfirmTitle?: string
    removeConfirmMessage?: string
    removeConfirmConfirm?: string
    removeConfirmCancel?: string
  } = $props()

  let isUploading = $state(false)
  let uploaded = $state(value)
</script>

<OverlayProvider>
  <FileUpload
    bind:value={uploaded}
    removeLabel="Remove"
    replaceLabel="Replace image"
    {removeConfirmTitle}
    {removeConfirmMessage}
    {removeConfirmConfirm}
    {removeConfirmCancel}
  />
  <span data-testid="bound-value">{uploaded}</span>
</OverlayProvider>
