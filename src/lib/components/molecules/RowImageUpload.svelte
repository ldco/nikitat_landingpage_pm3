<script lang="ts">
  /**
   * RowImageUpload — compact per-row image upload button for repeatable media
   * rows (gallery/screenshots/pages).
   *
   * Uploads ONE image to the hardened image endpoint and writes the returned
   * URL into the bindable `url` prop (the row's url field). It never renders a
   * text input — the caption stays a separate FormField next to it. Uses the
   * canonical IconButton primitive for the trigger.
   *
   * @props {string} url — the row's image URL (two-way bindable)
   * @props {string} [uploadingLabel=''] — uploading state text
   * @props {string} [uploadFailedLabel=''] — upload failure message
   * @props {string} [ariaLabel=''] — accessible label for the upload button
   *
   * @example
   * <RowImageUpload bind:url={img.url} ariaLabel={t('admin.portfolioImageUrl')} />
   */
  import { getCsrfToken } from '$lib/utils/auth'
  import { API_ROUTES } from '$lib/utils/api-paths'
  import IconButton from '$lib/components/atoms/IconButton.svelte'
  import IconUpload from '@tabler/icons-svelte/icons/upload'

  let {
    url = $bindable(''),
    uploadingLabel = '',
    uploadFailedLabel = '',
    ariaLabel = ''
  }: {
    url?: string
    uploadingLabel?: string
    uploadFailedLabel?: string
    ariaLabel?: string
  } = $props()

  let uploading = $state(false)
  let uploadError = $state('')
  let inputId = $state('')

  $effect(() => {
    if (!inputId) inputId = 'row-upload-' + Math.random().toString(36).slice(2, 9)
  })

  async function handleInput(e: Event): Promise<void> {
    const file = (e.currentTarget as HTMLInputElement).files?.[0]
    if (!file) return
    uploading = true
    uploadError = ''
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await fetch(API_ROUTES.upload.image, {
        method: 'POST',
        headers: { 'x-csrf-token': getCsrfToken() },
        body: formData
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) throw new Error()
      url = (json.data?.url as string) ?? ''
    } catch {
      uploadError = uploadFailedLabel
    } finally {
      uploading = false
      // Reset so selecting the SAME file again re-triggers the change event.
      const input = document.getElementById(inputId) as HTMLInputElement | null
      if (input) input.value = ''
    }
  }
</script>

<div class="flex items-center gap-1">
  <IconButton
    ariaLabel={ariaLabel || uploadingLabel || 'upload'}
    onclick={() => document.getElementById(inputId)?.click()}
    disabled={uploading}
  >
    <IconUpload class="size-4" />
  </IconButton>
  <input
    id={inputId}
    type="file"
    accept="image/*"
    onchange={handleInput}
    class="hidden"
  />
  {#if uploadError}
    <span class="text-xs text-pm-danger">{uploadError}</span>
  {/if}
</div>
