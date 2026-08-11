# Step 17: Build Portfolio Items Management UI

## Why

Portfolio CRUD works (create/edit/delete portfolios), but portfolio items (images,
descriptions within a portfolio) have no admin UI. The API supports
`/api/admin/portfolios/[id]/items/` but no page renders it.

## What

Add a portfolio items management page within the portfolio edit flow:
1. New route: `admin/portfolios/[id]/items/+page.svelte` + `+page.server.ts`
2. Shows items in a grid/table
3. Create/Edit/Delete items with modal
4. Upload images for items (uses Step 15 FileUpload)
5. Reorder items (drag-and-drop or up/down buttons)
6. Link from portfolio edit page

## Prerequisites

- Step 01 (`AdminModal`)
- Step 02 (`AdminFormSection`)
- Step 15 (`FileUpload`)

## Implementation

### Route: `admin/portfolios/[id]/items/+page.svelte`

Show items for a specific portfolio. Each item has:
- Image (thumbnail)
- Title
- Description
- Order
- Edit/Delete actions
- Add Item button

### Route: `admin/portfolios/[id]/items/+page.server.ts`

Load portfolio + items. Require `requireAdminPage(event, 'portfolios')`.

### Link from portfolio edit page

Add a "Manage Items" button on `admin/portfolios/[id]/edit/+page.svelte`:

```svelte
<CtaButton variant="secondary" href={ADMIN_ROUTES.portfolioItems(portfolioId)}>
  {t('admin.manageItems')}
</CtaButton>
```

## Verification

```bash
npm run check

# 1. Edit a portfolio — "Manage Items" button visible
# 2. Click — navigates to items page
# 3. Add item — modal with image upload + text fields
# 4. Edit item — modal pre-filled
# 5. Delete item — confirm, item removed
# 6. Reorder — change order field, save
```

## Files to Create

| File |
|------|
| `src/routes/admin/portfolios/[id]/items/+page.svelte` |
| `src/routes/admin/portfolios/[id]/items/+page.server.ts` |

## Files to Modify

| File | Action |
|------|--------|
| `src/routes/admin/portfolios/[id]/edit/+page.svelte` | Add "Manage Items" link |
| `src/lib/utils/admin-paths.ts` | Add `portfolioItems(id)` route |
