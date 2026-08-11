# Step 16: Add Pagination to Admin Page-Level Data Loads

## Why

All admin `+page.server.ts` load functions use `.all()` without pagination. As data
grows, loading 1000+ blog posts or 5000+ contact submissions on every page load will
degrade performance. The API endpoints support pagination (`?page=1&limit=20`), but
the page-level loads don't.

## What

Add pagination to every admin list page server load:
- `admin/blog/+page.server.ts`
- `admin/faq/+page.server.ts`
- `admin/features/+page.server.ts`
- `admin/pricing/+page.server.ts`
- `admin/portfolios/+page.server.ts`
- `admin/users/+page.server.ts`
- `admin/contacts/+page.server.ts`
- `admin/audit/+page.server.ts`
- `admin/roles/+page.server.ts`

Add pagination controls component (or create a `Pagination` atom/molecule if one
doesn't exist).

## Implementation

### Part A: Check for existing pagination component

```bash
find src/lib/components -name "*Pagination*" -o -name "*paginate*"
```

If none exists, create `src/lib/components/molecules/Pagination.svelte`.

### Part B: Update each +page.server.ts

Pattern:
```typescript
export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'blog')
  const page = parseInt(event.url.searchParams.get('page') ?? '1')
  const limit = 20
  const offset = (page - 1) * limit

  const db = useDatabase()
  const total = db.select({ count: count() }).from(schema.blogPosts).get()?.count ?? 0
  const items = db.select({ ... }).from(schema.blogPosts)
    .limit(limit).offset(offset).all()

  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}
```

### Part C: Add Pagination component to each list page

```svelte
<Pagination
  page={data.pagination.page}
  totalPages={data.pagination.totalPages}
  getHref={(p) => `?page=${p}`}
/>
```

## Verification

```bash
npm run check

# 1. Each list page shows pagination at bottom
# 2. Click page 2 — URL updates, new items loaded
# 3. "Previous" and "Next" buttons disable at boundaries
# 4. Total count shown ("Showing 1-20 of 150")
```

## Files to Create

| File |
|------|
| `src/lib/components/molecules/Pagination.svelte` (if not exists) |

## Files to Modify

| File | Action |
|------|--------|
| 9 `+page.server.ts` files | Add pagination query params |
| 9 `+page.svelte` files | Add Pagination component |
