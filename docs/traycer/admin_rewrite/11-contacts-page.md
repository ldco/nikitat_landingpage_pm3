# Step 11: Enable Contacts Module + Add Read/Delete Actions to Inbox

## Why

Contacts admin page returns 404 because `MODULES.contact.enabled = false`.

**Gate analysis** (see ADR-001 in master plan):
- `ADMIN_CONFIG.websiteModules.contacts.enabled = true` — admin gate is OPEN
- `MODULES.contact.enabled = false` — public module gate is CLOSED
- Fix: set `MODULES.contact.enabled = true`. **WARNING**: This also enables the
  public contact form on the website. If the product intent is "admin manages
  contacts but public form stays hidden," the gate logic in `admin-pages.ts` must
  be adjusted first (separate architectural decision — see ADR-001).

The contacts list page (45 lines) shows an `AdminDataTable` but has no actions —
the inbox is read-only. The `DELETE` API endpoint exists. The `contactSubmissions`
table has a `read` field (int bool, default false) and the `contact.ts` service has
`markAsRead(id)` (sets `read: true`) and `getUnreadCount()` (counts `WHERE read = false`).
These are already wired — the badge in the admin layout already reflects unread counts.

**What's missing is a PATCH/action to call `markAsRead()` from the UI.**

## What

1. Enable contacts module (with understanding of public site impact)
2. Add delete action button per submission (uses `adminDelete('contacts', id)`)
3. Add mark-as-read action — create a PATCH endpoint or form action that calls
   `markAsRead(id)` from the contact service
4. Add visual read/unread indicators (bold row for unread)
5. Add "Mark all as read" bulk action (optional — future work)

## Prerequisites

- ADR-001 in master plan (dual-gate architecture reference)
- Understanding that `MODULES.contact.enabled = true` enables public contact form

## Implementation

### Part A: Enable contacts module

**File**: `src/project/site-config.ts`

```typescript
// Change:
contact: { enabled: false, config: { ... } }
// To:
contact: { enabled: true, config: { ... } }
```

⚠️ This also enables the public contact form. Verify this is the intended behavior.
If admins should manage contacts without a public form, adjust `admin-pages.ts`
gate logic first (separate task).

### Part B: Add mark-as-read API endpoint

The `contact.ts` service already has `markAsRead(id)` and `getUnreadCount()`.
The contacts API at `src/routes/api/admin/contacts/[id]/+server.ts` supports only
`GET` and `DELETE`. Add a `PATCH` handler:

**File**: `src/routes/api/admin/contacts/[id]/+server.ts`

```typescript
import { z } from 'zod'
import { markAsRead } from '$lib/server/services'

// PATCH schema: only supported operation is marking as read
const patchContactSchema = z.object({
  read: z.literal(true)
})

export async function PATCH(event: RequestEvent) {
  requireAdminPage(event, 'contacts')
  const id = contactIdSchema.parse(event.params.id)

  const body = await event.request.json().catch(() => null)
  if (!body) error(400, 'Invalid JSON body')

  const parsed = patchContactSchema.safeParse(body)
  if (!parsed.success) {
    throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  }

  // Only supported PATCH operation: mark as read (validated above)
  const updated = markAsRead(id)
  if (!updated) error(404)
  return json(jsonSuccess({ id, read: true }))
}
```

**Accepted request shape** (mutation contract per AGENTS.md Rule 10):
```json
{ "read": true }
```
The `z.literal(true)` schema ensures only `true` is accepted. Any other value
(`false`, `"yes"`, etc.) returns 400 with Zod error details.

### Part C: Server load — include `read` field

**File**: `src/routes/admin/contacts/+page.server.ts`

Ensure the `read` field is included in the SELECT:

```typescript
const items = db.select({
  id: schema.contactSubmissions.id,
  name: schema.contactSubmissions.name,
  email: schema.contactSubmissions.email,
  subject: schema.contactSubmissions.subject,
  message: schema.contactSubmissions.message,
  read: schema.contactSubmissions.read,
  createdAt: schema.contactSubmissions.createdAt
})
  .from(schema.contactSubmissions)
  .orderBy(desc(schema.contactSubmissions.createdAt))
  .all()
```

### Part D: List page — read/unread indicator + actions

**File**: `src/routes/admin/contacts/+page.svelte`

Add `read` column and visual styling:

```svelte
const columns = $derived<AdminTableColumn[]>([
  { key: 'read', label: '' },  // no label — just the indicator
  { key: 'name', label: t('common.name') },
  { key: 'email', label: t('common.email') },
  { key: 'date', label: t('common.date') }
])
```

```svelte
{#snippet cell(column, item)}
  {@const row = item as { id: number; name: string; email: string; read: boolean; createdAt: Date }}
  {#if column.key === 'read'}
    {#if !row.read}
      <span class="inline-block size-2 rounded-full bg-pm-brand" title={t('admin.unread')}></span>
    {/if}
  {:else if column.key === 'name'}
    <span class={clsx('font-medium', !row.read && 'font-bold text-pm-text')}>
      {row.name}
    </span>
  {:else if column.key === 'email'}
    <span class="text-pm-text-muted">{row.email}</span>
  {:else}
    <span class="text-pm-text-muted text-sm">{new Date(row.createdAt).toLocaleDateString()}</span>
  {/if}
{/snippet}
```

Actions snippet — mark-as-read + delete:

```svelte
{#snippet actions(item)}
  {@const row = item as { id: number; name: string; read: boolean }}
  <div class="flex items-center justify-end gap-1">
    {#if !row.read}
      <button onclick={() => handleMarkRead(row.id)}
        class="p-1.5 rounded-md text-pm-text-muted hover:text-pm-brand hover:bg-pm-bg-sunken transition-colors"
        title={t('admin.markRead')} aria-label={t('admin.markRead')}>
        <IconEye class="size-4" />
      </button>
    {/if}
    <button onclick={() => handleDelete(row.id, row.name)}
      disabled={deletePending === row.id}
      class="p-1.5 rounded-md text-pm-text-muted hover:text-pm-danger hover:bg-pm-bg-sunken transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      aria-label={t('common.delete')}>
      <IconTrash class="size-4" />
    </button>
  </div>
{/snippet}
```

### Part E: handleMarkRead function

```typescript
async function handleMarkRead(id: number) {
  try {
    const res = await fetch(`/api/admin/contacts/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': $page.data.csrfToken
      },
      body: JSON.stringify({ read: true })
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    // Refresh the page to update unread badge and styling
    goto(ADMIN_ROUTES.contacts)
  } catch (e: unknown) {
    console.error('[admin] mark read failed:', e instanceof Error ? e.message : e)
  }
}
```

### Part F: handleDelete function

Uses `adminDelete('contacts', id)` — contacts IS in the `AdminDeleteModule` type.
Same pattern as portfolio/FAQ pages.

### Part G: Unread badge — already works

The admin layout's unread count badge already uses `getCachedUnreadCount()` →
`getUnreadCount()` from the contact service, which counts `WHERE read = false`.
When submissions are marked as read, the badge updates on the next 30s polling
interval or page refresh. No additional work needed.

### Part H: NO schema changes needed

The `contactSubmissions.read` field already exists (int bool, default false).
The `markAsRead()` function already exists in `contact.ts`. No migrations, no
schema changes, no new columns.

## Verification

```bash
npm run check

# 1. /admin/contacts — page loads (no longer 404, if module enabled)
# 2. Unread submissions shown in bold with blue dot and mark-read button
# 3. Click mark-read → submission becomes normal weight, dot disappears
# 4. Unread badge in sidebar updates
# 5. Delete button works with confirm
# 6. Read submissions show no dot, normal weight
# 7. Public contact form: verify it's visible (module enabled) or hidden (if gate adjusted)
```

## Files to Modify

| File | Action |
|------|--------|
| `src/project/site-config.ts` | Set `MODULES.contact.enabled = true` (with public site awareness) |
| `src/routes/api/admin/contacts/[id]/+server.ts` | Add PATCH handler for `{ read: true }` |
| `src/routes/admin/contacts/+page.svelte` | Add read column indicator + mark-read + delete actions |
| `src/routes/admin/contacts/+page.server.ts` | Add `read` field to SELECT |

## Do NOT Modify

- ❌ `contactSubmissions` schema — `read` field already exists
- ❌ `contact.ts` service — `markAsRead()` and `getUnreadCount()` already exist
- ❌ Admin layout — unread badge already uses `getCachedUnreadCount()` → `getUnreadCount()`
