<script lang="ts">
  import OverlayProvider from '$lib/components/complex/OverlayProvider.svelte'
  import FileUpload from '$lib/components/molecules/FileUpload.svelte'
  import PortfolioCardPreview from '$lib/components/admin/PortfolioCardPreview.svelte'
  import { createFormDirty } from '$lib/utils/form-dirty.svelte'

  // Mirrors the REAL edit page: hidden input + FileUpload + PortfolioCardPreview
  // all bound to the SAME coverImageUrl state, WITH the $effect.pre seeding +
  // markClean() that the real page has.
  let {
    coverImageUrl = '',
    thumbnails = [] as string[],
    previewTitle = '',
    previewHint = ''
  }: {
    coverImageUrl?: string
    thumbnails?: string[]
    previewTitle?: string
    previewHint?: string
  } = $props()

  const p = { coverImageUrl: coverImageUrl || null, name: 'Test', slug: 'test' }

  const { markClean } = createFormDirty(() => ({ coverImageUrl, name: 'Test', slug: 'test' }))

  $effect.pre(() => {
    coverImageUrl = p.coverImageUrl ?? ''
    markClean()
  })
</script>

<OverlayProvider>
  <input type="hidden" name="coverImageUrl" value={coverImageUrl} />
  <FileUpload
    bind:value={coverImageUrl}
    removeLabel="Remove"
    replaceLabel="Replace image"
    removeConfirmTitle="Remove image?"
    removeConfirmMessage="The cover will be removed."
    removeConfirmConfirm="Remove"
    removeConfirmCancel="Cancel"
  />
  <PortfolioCardPreview
    bind:coverImageUrl={coverImageUrl}
    {thumbnails}
    title={previewTitle}
    hint={previewHint}
  />
  <span data-testid="hidden-bound">{coverImageUrl}</span>
</OverlayProvider>
