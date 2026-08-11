# Step 12: Add CRUD UI to Roles Page (with Permissions Editing)

## Why

The roles page (49 lines) is a read-only `AdminDataTable` showing name/slug/level/color.
The API endpoints `GET/POST/PUT/DELETE /api/admin/roles/[id]` exist and work, but the
UI has no Create/Edit/Delete functionality.

**Backend contracts** (verified against live code):

| Operation | API | Schema Fields | Notes |
|-----------|-----|---------------|-------|
| Create | `POST /api/admin/roles` | `name`, `slug`, `description?`, `permissions?` (JSON string, default `'{}'`), `level` (int, default 0), `color?` (default `'secondary'`) | All new roles get `isBuiltIn: false`. Audited. |
| Update | `PUT /api/admin/roles/[id]` | `name?`, `description?`, `permissions?`, `level?`, `color?` | **Slug is NOT in the update schema.** Slug is immutable after creation. |
| Delete | `DELETE /api/admin/roles/[id]` | — | **Built-in roles return 400.** Delete blocked if `existing.isBuiltIn === true`. Uses `db.delete()` directly, NOT `adminDelete()`. Audited. |
| Get list | `GET /api/admin/roles` | Returns all role columns including `isBuiltIn`, `permissions` | — |

**Critical corrections from the original plan**:
1. **No slug editing** — the backend `updateRoleSchema` does not include `slug`. The edit form must NOT have a slug field.
2. **Delete path** — `adminDelete()` from `src/lib/api/client.ts` does NOT include `'roles'` in its `AdminDeleteModule` type (`'portfolios' | 'blog' | 'features' | 'faq' | 'pricing' | 'contacts' | 'users'`). The delete must use a direct `fetch` to `/api/admin/roles/${id}` with `method: 'DELETE'` and CSRF header. Do NOT add `'roles'` to `AdminDeleteModule`.
3. **Built-in role protection** — the `DELETE` backend returns 400 for `isBuiltIn` roles. The UI must **disable the delete button** for built-in roles (master, admin, editor). The backend already enforces this — the UI guard is a convenience layer.
4. **Permissions editing is mandatory** — the `permissions` field stores a JSON string of `{ [pageId]: boolean }`. Without editing permissions, custom roles are useless (they default to `{}` which grants nothing). The create/edit form MUST include a permissions editor.

## What

Add to `src/routes/admin/roles/+page.svelte`:
1. **Create Role modal** — `name`, `slug`, `description`, `level`, `color`, `permissions` (checkbox grid)
2. **Edit Role modal** — `name`, `description`, `level`, `color`, `permissions` (NO slug — immutable)
3. **Delete with confirm** — direct fetch DELETE, disabled for built-in roles
4. **Permissions editor** — checkbox grid of all admin pages from `ADMIN_PAGE_DEFS`
5. **Built-in role indicators** — visual badge + disabled delete button

## Prerequisites

- **Step 01**: `AdminModal` molecule must exist.
- **Step 05**: `FormField` migration should be complete (use FormField for text/number inputs).

## Implementation

### Part A: Permissions Editor Component

Since this is a reusable pattern (checkbox grid per admin page, serialized to JSON string),
create a small inline helper rather than a separate component (for now — extract if reused).

The permissions editor renders a list of checkboxes, one per admin page from `ADMIN_PAGE_DEFS`:

```typescript
// In the page's <script> section:
import { ADMIN_PAGE_DEFS } from '$lib/server/utils/admin-pages'

// Build the list of pages for the permissions editor
const availablePages = $derived(
  Object.values(ADMIN_PAGE_DEFS)
    .filter(def => def.menu !== false)
    .map(def => ({
      id: def.id,
      label: adminT[`admin.${def.id}`] ?? def.id
    }))
)

// Permissions state: Record<string, boolean>
let permissions = $state<Record<string, boolean>>({})

function togglePermission(pageId: string) {
  permissions = { ...permissions, [pageId]: !permissions[pageId] }
}

// Serialize to JSON string for the API
const permissionsJson = $derived(JSON.stringify(permissions))

// Deserialize from JSON string (when editing existing role)
function loadPermissions(json: string) {
  try {
    permissions = JSON.parse(json) as Record<string, boolean>
  } catch {
    permissions = {}
  }
}
```

**IMPORTANT**: `ADMIN_PAGE_DEFS` is a server module. It CAN be imported into `.svelte` files
because it's a pure data constant (no server-only deps). If Vite complains, import the
page IDs list from a shared location or pass them from the server load function via `data`.

Alternative: pass `availablePages` from `+page.server.ts`:
```typescript
// In +page.server.ts load:
import { ADMIN_PAGE_DEFS } from '$lib/server/utils/admin-pages'
const pages = Object.values(ADMIN_PAGE_DEFS)
  .filter(def => def.menu !== false)
  .map(def => ({ id: def.id }))
return { items, pages }
```

**Decision**: Pass page IDs from server load to avoid client-side import issues.
The permission checkbox labels are derived client-side from the admin translations
record: `adminT[\`admin.$\{page.id}\`] ?? page.id`. This avoids shipping i18n
resolution into the server load and keeps the data contract simple.

### Part B: Create Role Modal

Fields in the create form (matching `createRoleSchema`):
- `name` — text, required, max 50 chars
- `slug` — text, required, regex `/^[a-z0-9-]+$/`, max 50 chars. **Only on create — not editable.**
- `description` — text, optional, max 255 chars
- `level` — number, integer, default 0
- `color` — select: primary, secondary, success, warning, danger
- `permissions` — checkbox grid (see Part A)

```svelte
<AdminModal
  open={showModal}
  title={editingRole ? t('admin.editRole') : t('admin.createRole')}
  maxWidthClass="max-w-lg"
  onclose={closeModal}
  onsubmit={handleSubmit}
  submitDisabled={saving}
  loading={saving}
>
  <div class="flex flex-col gap-4">
    <FormField name="name" label={t('common.name')} bind:value={form.name} required />
    {#if !editingRole}
      <FormField name="slug" label={t('admin.slug')} bind:value={form.slug} required
        placeholder="lowercase-hyphenated" />
      <p class="text-xs text-pm-text-muted -mt-2">{t('admin.slugImmutable')}</p>
    {/if}
    <FormField name="description" label={t('admin.description')} bind:value={form.description} />
    <FormField name="level" type="number" label={t('admin.level')} bind:value={form.level} />

    <div class="flex flex-col gap-1.5">
      <label for="field-color" class="text-sm font-medium text-pm-text">{t('admin.color')}</label>
      <select name="color" id="field-color" bind:value={form.color}
        class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text">
        <option value="primary">{t('admin.colorPrimary')}</option>
        <option value="secondary">{t('admin.colorSecondary')}</option>
        <option value="success">{t('admin.colorSuccess')}</option>
        <option value="warning">{t('admin.colorWarning')}</option>
        <option value="danger">{t('admin.colorDanger')}</option>
      </select>
    </div>

    <fieldset>
      <legend class="text-sm font-medium text-pm-text mb-2">{t('admin.permissions')}</legend>
      <div class="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border border-pm-border rounded-md p-3">
        {#each pages as page}
          <label class="flex items-center gap-2 text-sm text-pm-text cursor-pointer">
            <input type="checkbox"
              checked={permissions[page.id] === true}
              onchange={() => togglePermission(page.id)}
              class="size-4 rounded border-pm-border text-pm-brand focus:ring-pm-brand" />
            {adminT[`admin.${page.id}`] ?? page.id}
          </label>
        {/each}
      </div>
    </fieldset>
  </div>
</AdminModal>
```

### Part C: Handle Submit (create/update)

```typescript
async function handleSubmit() {
  saving = true
  try {
    const body: Record<string, unknown> = {
      name: form.name,
      description: form.description || undefined,
      level: form.level,
      color: form.color,
      permissions: permissionsJson
    }

    if (!editingRole) {
      // Create: include slug (only on create)
      body.slug = form.slug
    }
    // Update: slug is NOT sent (not in updateRoleSchema)

    const url = editingRole
      ? `/api/admin/roles/${editingRole.id}`
      : '/api/admin/roles'
    const method = editingRole ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': $page.data.csrfToken
      },
      body: JSON.stringify(body)
    })

    if (!res.ok) {
      const err = await res.json().catch(() => null)
      throw new Error(err?.message ?? `HTTP ${res.status}`)
    }

    closeModal()
    goto('/admin/roles')
  } catch (e: unknown) {
    console.error('[admin] role save failed:', e instanceof Error ? e.message : e)
    // Show error to user — could add a form-level error state
  } finally {
    saving = false
  }
}
```

### Part D: Handle Delete

**Do NOT use `adminDelete('roles', id)`** — `'roles'` is not in the `AdminDeleteModule` type.
Use a direct fetch to the DELETE endpoint:

```typescript
async function handleDelete(id: number, name: string) {
  const msg = adminT['admin.confirmDelete'] ?? t('common.areYouSure')
  if (!confirm(msg + ' "' + name + '"?')) return
  deletePending = id
  deleteError = null
  try {
    const res = await fetch(`/api/admin/roles/${id}`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': $page.data.csrfToken }
    })
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      throw new Error(err?.message ?? `HTTP ${res.status}`)
    }
    goto('/admin/roles')
  } catch (e: unknown) {
    console.error('[admin] role delete failed:', e instanceof Error ? e.message : e)
    deleteError = t('common.error')
  } finally {
    deletePending = null
  }
}
```

### Part E: Built-in Role Protection

The backend already blocks DELETE for built-in roles (returns 400). The UI MUST also
disable the delete button for built-in roles as a convenience layer:

```svelte
{#snippet actions(item)}
  {@const row = item as { id: number; name: string; slug: string; level: number; color: string; isBuiltIn: boolean }}
  <div class="flex items-center justify-end gap-1">
    <button onclick={() => openEdit(row)}
      class="p-1.5 rounded-md text-pm-text-muted hover:text-pm-brand hover:bg-pm-bg-sunken transition-colors"
      aria-label={t('common.edit')}>
      <IconPencil class="size-4" />
    </button>
    <button onclick={() => handleDelete(row.id, row.name)}
      disabled={deletePending === row.id || row.isBuiltIn}
      title={row.isBuiltIn ? t('admin.builtInRoleCantDelete') : undefined}
      class="p-1.5 rounded-md text-pm-text-muted hover:text-pm-danger hover:bg-pm-bg-sunken transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      aria-label={t('common.delete')}>
      <IconTrash class="size-4" />
    </button>
  </div>
{/snippet}
```

Add a "Built-in" badge for built-in roles in the cell snippet:
```svelte
{#if column.key === 'name'}
  <span class="font-medium text-pm-text">{row.name}</span>
  {#if row.isBuiltIn}
    <Badge variant="warning" class="ml-2">{t('admin.builtIn')}</Badge>
  {/if}
```

### Part F: Server Load Update

Update `+page.server.ts` to include `isBuiltIn` and `permissions` in the selection:

```typescript
export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'roles')
  const db = useDatabase()
  // Single query — all fields the edit modal and permissions editor need
  const items = db.select({
    id: schema.roles.id,
    name: schema.roles.name,
    slug: schema.roles.slug,
    description: schema.roles.description,
    level: schema.roles.level,
    color: schema.roles.color,
    isBuiltIn: schema.roles.isBuiltIn,
    permissions: schema.roles.permissions
  }).from(schema.roles).all()

  // Pass available admin page IDs for the permissions editor checkbox grid.
  // Labels are derived client-side via getAdminT(page.data):
  //   adminT[`admin.${page.id}`] ?? page.id
  const pages = Object.values(ADMIN_PAGE_DEFS)
    .filter(def => def.menu !== false)
    .map(def => ({ id: def.id }))

  return { items, pages }
}
```

### Part G: Open Edit — Load Permissions

When opening the edit modal for an existing role, deserialize the permissions JSON:

```typescript
function openEdit(role: { id: number; name: string; slug: string; description: string | null; level: number; color: string; permissions: string }) {
  editingRole = role
  form = {
    name: role.name,
    slug: role.slug,
    description: role.description ?? '',
    level: role.level,
    color: role.color
  }
  loadPermissions(role.permissions)  // deserialize JSON string → Record<string, boolean>
  showModal = true
}
```

## PM3 Framework Rules

- **Form contract**: Uses `fetch` with CSRF header, NOT `adminDelete` (roles not in AdminDeleteModule).
- **Admin form pattern**: SvelteKit form actions with Zod validation are used for page-level POST.
  API calls for modals use direct fetch (same CSRF pattern).
- **Canonical primitives**: Use `FormField`, `AdminModal`, `Badge`, `CtaButton`, `PageHeader`.
- **i18n**: All labels use i18n keys. "Built-in" badge, "Cannot delete built-in role" tooltip,
  color names, permission labels — all must have i18n keys.

## Edge Cases

- **Delete built-in role**: Button disabled in UI. If bypassed via console, backend returns 400.
- **Slug conflict on create**: Backend validates uniqueness. Error message shown to user.
- **Empty permissions**: Sent as `"{}"` JSON string. Roles with no permissions grant nothing.
- **Permissions JSON parse failure**: `loadPermissions` catches parse errors and defaults to `{}`.

## Verification

```bash
npm run check

# 1. /admin/roles — shows table with built-in badges, Edit/Delete buttons
# 2. Built-in roles have disabled delete buttons
# 3. Click "Add Role" — modal opens with all fields including slug
# 4. Fill form + permissions, submit — role created
# 5. Click edit on a non-built-in role — modal opens WITHOUT slug field
# 6. Change permissions, submit — role updated
# 7. Click delete on non-built-in role — confirm, role removed
# 8. Click delete on built-in role — button is disabled
```

## Files to Modify

| File | Action |
|------|--------|
| `src/routes/admin/roles/+page.svelte` | Add modal + form + permissions editor + actions (49 → ~280) |
| `src/routes/admin/roles/+page.server.ts` | Add `isBuiltIn`, `permissions`, `pages` to load |
