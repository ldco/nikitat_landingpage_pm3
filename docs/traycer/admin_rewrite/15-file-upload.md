# Step 15: Build Admin File Upload UI Component

## Why

Blog covers, portfolio item images, and client logos require file uploads. There is
no admin UI component for file upload yet.

**Existing hardened upload endpoints already exist** (verified):
- `POST /api/upload/image` — admin auth, rate limiting (per-IP), magic bytes validation
  (PNG/JPEG/WebP/AVIF/GIF), virus scanning (ClamAV, fail-open), Sharp processing
  (resize to max dimensions, WebP convert, 320×320 thumbnail), storage adapter
  (local/S3). Returns `{ url, thumbnailUrl, width, height }`.
- `POST /api/upload/video` — same security layers, no Sharp processing, storage adapter.

**DO NOT create a new `/api/admin/upload` endpoint** — the existing endpoints are
more hardened (magic bytes, virus scan, rate limit, image processing) than anything
a new endpoint would provide. Reuse them.

## What

Create `src/lib/components/molecules/FileUpload.svelte` — a drag-and-drop +
click-to-browse file upload component that POSTs to the existing endpoints.
No backend work required.

If admin-only access is needed for the existing endpoints, verify they use
`requireAdmin()` (yes — both `image` and `video` endpoints already call `requireAdmin(event)`).

## Prerequisites

None — standalone UI component.

## Implementation

### Part A: FileUpload component

**File**: `src/lib/components/molecules/FileUpload.svelte`

#### Props

```typescript
let {
  accept = 'image/*',
  maxSize = STORAGE_CONFIG.images.maxSize,  // from site config
  value = $bindable(''),       // current URL string (two-way binding)
  endpoint = '/api/upload/image',  // which endpoint to POST to
  class: className = ''
}: {
  accept?: string
  maxSize?: number
  value?: string
  endpoint?: string
  class?: string
} = $props()
```

#### States

- `idle` — initial state, shows drop zone
- `uploading` — file is being uploaded, shows progress
- `preview` — upload complete, shows image/video preview
- `error` — upload failed, shows error message

#### Template

```svelte
<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import IconUpload from '@tabler/icons-svelte/icons/upload'
  import IconX from '@tabler/icons-svelte/icons/x'
  import IconPhoto from '@tabler/icons-svelte/icons/photo'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import { STORAGE_CONFIG } from '$lib/config/site'
  import { getCsrfToken } from '$lib/utils/auth'

  let {
    accept = 'image/*',
    maxSize = STORAGE_CONFIG.images.maxSize,
    value = $bindable(''),
    endpoint = '/api/upload/image',
    class: className = ''
  }: {
    accept?: string
    maxSize?: number
    value?: string
    endpoint?: string
    class?: string
  } = $props()

  let uploading = $state(false)
  let uploadError = $state<string | null>(null)
  let dragOver = $state(false)

  // The existing endpoint expects the file in a field named 'image' (not 'file')
  const fieldName = $derived(endpoint.includes('video') ? 'video' : 'image')

  async function handleFile(file: File) {
    if (file.size > maxSize) {
      uploadError = `File too large (max ${Math.round(maxSize / 1024 / 1024)}MB)`
      return
    }
    uploading = true
    uploadError = null
    try {
      const formData = new FormData()
      formData.append(fieldName, file)
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'x-csrf-token': getCsrfToken() },
        body: formData
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message ?? json.message ?? `HTTP ${res.status}`)
      }
      value = json.data.url  // Set the returned URL
    } catch (e: unknown) {
      uploadError = e instanceof Error ? e.message : 'Upload failed'
    } finally {
      uploading = false
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    dragOver = false
    const file = e.dataTransfer?.files?.[0]
    if (file) handleFile(file)
  }

  function handleInput(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) handleFile(file)
  }

  function clearValue() {
    value = ''
    uploadError = null
  }
</script>

<div class={twMerge(clsx('flex flex-col gap-2', className))}>
  {#if value}
    <!-- Preview mode: show uploaded image + clear button -->
    <div class="relative group rounded-md overflow-hidden border border-pm-border">
      <img src={value} alt="" class="w-full h-48 object-cover" />
      <button type="button" onclick={clearValue}
        class="absolute top-2 end-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Remove image">
        <IconX class="size-4" />
      </button>
    </div>
  {:else if uploading}
    <!-- Uploading: show spinner -->
    <div class="flex items-center justify-center h-48 border-2 border-dashed border-pm-border rounded-md bg-pm-bg-sunken">
      <div class="flex flex-col items-center gap-2 text-pm-text-muted">
        <div class="size-8 border-2 border-pm-brand border-t-transparent rounded-full animate-spin"></div>
        <span class="text-sm">Uploading...</span>
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
      onclick={() => document.getElementById('file-upload-input')?.click()}
      onkeydown={() => {}}
      role="button"
      tabindex="0"
    >
      <IconUpload class="size-8 text-pm-text-muted" />
      <p class="text-sm text-pm-text-muted">Drag & drop or click to browse</p>
      <p class="text-xs text-pm-text-muted">
        {accept.replace('image/', '').replace(',', ', ').toUpperCase()} up to {Math.round(maxSize / 1024 / 1024)}MB
      </p>
    </div>
    <input
      id="file-upload-input"
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
```

**Design decisions**:
- The CSRF token is sent via `x-csrf-token` header (existing endpoints don't use
  cookie-based CSRF — they rely on the header token).
- The file field name is `'image'` for the image endpoint, `'video'` for the video
  endpoint — matching the existing `formData.get('image')` / `formData.get('video')`.
- No thumbnail preview from the endpoint — use the main URL directly. The endpoint
  returns `thumbnailUrl` separately but using it would add complexity.

### Part B: Integrate into blog create/edit form

In `admin/blog/create/+page.svelte` and `admin/blog/[id]/edit/+page.svelte`:

```svelte
<script>
  import FileUpload from '$lib/components/molecules/FileUpload.svelte'
</script>

<AdminFormSection title={t('admin.media')}>
  <FileUpload bind:value={coverImageUrl} />
</AdminFormSection>
```

Replace the `FormField name="coverImageUrl"` with `FileUpload`. The `coverImageUrl`
state variable is bound to `FileUpload`'s `value` — when the upload completes,
the URL is set automatically.

### Part C: i18n

The upload component should NOT hardcode "Uploading...", "Drag & drop or click to browse",
or "File too large". These should be props with defaults, or use `t()`:

```typescript
let {
  // ...
  uploadingLabel = 'Uploading...',
  dropzoneLabel = 'Drag & drop or click to browse',
  maxSizeLabel = 'up to {size}MB'
} = $props()
```

**Decision**: Pass i18n-resolved strings from parent. Follow PM3 framework rule
"no hardcoded strings." The parent form page resolves them via `t()` or `adminT`.

## Security (already handled by existing endpoints)

The existing `/api/upload/image` and `/api/upload/video` endpoints already enforce:
- Admin authentication (`requireAdmin(event)`)
- Rate limiting (`uploadRateLimiter.check()`)
- Magic bytes validation (not Content-Type header)
- Virus scanning (ClamAV, fail-open)
- Image processing / size limits (Sharp)

The FileUpload component only needs to handle client-side size validation as a
convenience layer — the real security boundary is the API.

## Verification

```bash
npm run check

# 1. Blog create page: FileUpload drop zone visible
# 2. Drag an image onto the drop zone → upload starts, shows spinner
# 3. Upload completes → preview shows with clear button
# 4. Click clear → returns to drop zone
# 5. Submit form → coverImageUrl saved with the uploaded URL
# 6. Edit blog post → FileUpload shows existing image preview
# 7. Upload oversized file → client error "File too large"
# 8. Upload non-image file → server returns error via existing validation
```

## Files to Create

| File | Action |
|------|--------|
| `src/lib/components/molecules/FileUpload.svelte` | CREATE — upload UI component |

## Files to Modify

| File | Action |
|------|--------|
| `admin/blog/create/+page.svelte` | Replace coverImageUrl FormField with FileUpload |
| `admin/blog/[id]/edit/+page.svelte` | Same |

## Do NOT Create

- ❌ `src/routes/api/admin/upload/+server.ts` — do NOT create. Reuse existing `/api/upload/image` and `/api/upload/video`.
