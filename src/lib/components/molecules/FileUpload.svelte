<script lang="ts">
  /**
   * FileUpload — admin image/video upload with drag-and-drop and preview
   *
   * Uploads files to the existing hardened endpoints (/api/upload/image,
   * /api/upload/video) and binds the returned URL. The parent must pass
   * i18n-resolved labels.
   *
   * @props {string} [accept='image/*'] — accepted file types
   * @props {number} [maxSize=10485760] — max file size in bytes (default 10MB)
   * @props {string} value — current file URL (two-way bindable)
   * @props {string} [endpoint=API_ROUTES.upload.image] — upload endpoint
   * @props {string} [dropzoneLabel=''] — drop zone prompt text
   * @props {string} [uploadingLabel=''] — uploading state text
   * @props {string} [tooLargeLabel=''] — "file too large" message with {size} placeholder
   * @props {string} [uploadFailedLabel=''] — generic upload failure message
   * @props {string} [removeLabel=''] — remove/clear button aria-label
   * @props {string} [class] — additional classes
   *
   * @example
   * <FileUpload bind:value={coverImageUrl}
   *   dropzoneLabel={t('admin.dropzoneLabel')}
   *   uploadingLabel={t('common.uploading')}
   *   tooLargeLabel={t('admin.fileTooLarge')}
   *   uploadFailedLabel={t('admin.uploadFailed')}
   *   removeLabel={t('common.remove')} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import IconUpload from '@tabler/icons-svelte/icons/upload'
  import IconX from '@tabler/icons-svelte/icons/x'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import { getCsrfToken } from '$lib/utils/auth'
  import { API_ROUTES } from '$lib/utils/api-paths'

  let {
    accept = 'image/*',
    maxSize = 10 * 1024 * 1024,
    value = $bindable(''),
    endpoint = API_ROUTES.upload.image,
    dropzoneLabel = '',
    uploadingLabel = '',
    tooLargeLabel = '',
    uploadFailedLabel = '',
    removeLabel = '',
    class: className = ''
  }: {
    accept?: string
    maxSize?: number
    value?: string
    endpoint?: string
    dropzoneLabel?: string
    uploadingLabel?: string
    tooLargeLabel?: string
    uploadFailedLabel?: string
    removeLabel?: string
    class?: string
  } = $props()

  let uploading = $state(false)
  let uploadError = $state('')
  let dragOver = $state(false)
  let inputId = $state('')

  $effect(() => {
    if (!inputId) {
      inputId = 'file-upload-' + Math.random().toString(36).slice(2, 9)
    }
  })

  const fieldName = $derived(endpoint.includes('video') ? 'video' : 'image')

  async function handleFile(file: File): Promise<void> {
    if (file.size > maxSize) {
      const mb = Math.round(maxSize / 1024 / 1024)
      uploadError = tooLargeLabel ? tooLargeLabel.replace('{size}', String(mb)) : ''
      return
    }
    uploading = true
    uploadError = ''
    try {
      const formData = new FormData()
      formData.append(fieldName, file)
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'x-csrf-token': getCsrfToken() },
        body: formData
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) {
        throw new Error()
      }
      value = (json.data?.url as string) ?? ''
    } catch {
      uploadError = uploadFailedLabel
    } finally {
      uploading = false
    }
  }

  function handleDrop(e: DragEvent): void {
    e.preventDefault()
    dragOver = false
    const file = e.dataTransfer?.files?.[0]
    if (file) handleFile(file)
  }

  function handleInput(e: Event): void {
    const file = (e.currentTarget as HTMLInputElement).files?.[0]
    if (file) handleFile(file)
  }

  function clearValue(): void {
    value = ''
    uploadError = ''
  }
</script>

<div class={twMerge(clsx('flex flex-col gap-2', className))}>
  {#if value}
    <!-- Preview mode: show uploaded image + clear button -->
    <div class="relative group rounded-md overflow-hidden border border-pm-border">
      <img src={value} alt="" class="w-full h-48 object-cover" />
      <button type="button" onclick={clearValue}
        class="absolute top-2 end-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label={removeLabel}>
        <IconX class="size-4" />
      </button>
    </div>
  {:else if uploading}
    <!-- Uploading: show spinner -->
    <div class="flex items-center justify-center h-48 border-2 border-dashed border-pm-border rounded-md bg-pm-bg-sunken">
      <div class="flex flex-col items-center gap-2 text-pm-text-muted">
        <div class="size-8 border-2 border-pm-brand border-t-transparent rounded-full animate-spin"></div>
        <span class="text-sm">{uploadingLabel}</span>
      </div>
    </div>
  {:else}
    <!-- Drop zone -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class={clsx(
        'flex flex-col items-center justify-center gap-2 h-48 border-2 border-dashed rounded-md transition-colors cursor-pointer',
        dragOver ? 'border-pm-brand bg-pm-brand-subtle' : 'border-pm-border bg-pm-bg-sunken hover:border-pm-text-muted'
      )}
      ondrop={handleDrop}
      ondragover={(e) => { e.preventDefault(); dragOver = true }}
      ondragleave={() => dragOver = false}
      onclick={() => document.getElementById(inputId)?.click()}
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') document.getElementById(inputId)?.click() }}
      role="button"
      tabindex="0"
    >
      <IconUpload class="size-8 text-pm-text-muted" />
      <p class="text-sm text-pm-text-muted">{dropzoneLabel}</p>
      <p class="text-xs text-pm-text-muted">{accept.replace('image/', '').replace(',', ', ').toUpperCase()}</p>
    </div>
    <input
      id={inputId}
      type="file"
      {accept}
      onchange={handleInput}
      class="hidden"
    />
  {/if}

  {#if uploadError}
    <p class="text-xs text-pm-danger">{uploadError}</p>
  {/if}
</div>
