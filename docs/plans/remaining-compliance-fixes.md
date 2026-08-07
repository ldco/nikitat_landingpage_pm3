# Remaining Compliance Fixes — FABRICA22

**Items from the audit left unfixed in the initial repair:**

## 1. Admin Form Contracts (9 form pairs)
Each needs: Zod schema in `+page.server.ts` + error rendering in `+page.svelte`

| File | Current state | Fix |
|------|--------------|-----|
| `admin/blog/[id]/edit/+page.server.ts` | Manual `form.get()` validation | Add Zod schema + `fail()` error return |
| `admin/blog/[id]/edit/+page.svelte` | No error rendering | Add `$page.form` error display |
| `admin/faq/create/+page.server.ts` | Manual slug check | Add Zod schema |
| `admin/faq/create/+page.svelte` | No error rendering | Add error display |
| `admin/faq/[id]/edit/+page.server.ts` | Manual validation | Add Zod schema |
| `admin/faq/[id]/edit/+page.svelte` | No error rendering | Add error display |
| `admin/features/create/+page.server.ts` | Manual validation | Add Zod schema |
| `admin/features/create/+page.svelte` | No error rendering | Add error display |
| `admin/features/[id]/edit/+page.server.ts` | Manual validation | Add Zod schema |
| `admin/features/[id]/edit/+page.svelte` | No error rendering | Add error display |
| `admin/pricing/create/+page.server.ts` | Manual `form.get()` | Add Zod schema |
| `admin/pricing/create/+page.svelte` | No error rendering | Add error display |
| `admin/pricing/[id]/edit/+page.server.ts` | Manual validation | Add Zod schema |
| `admin/pricing/[id]/edit/+page.svelte` | No error rendering | Add error display |
| `admin/portfolios/create/+page.svelte` | Has Zod, no error display | Add error rendering |
| `admin/portfolios/[id]/edit/+page.svelte` | Has Zod, no error display | Add error rendering |

## 2. Admin Layout Internal Fetch
- `admin/+layout.svelte:92` — `fetch('/api/admin/contacts/unread')` → move to `+layout.server.ts`
- `admin/+layout.server.ts` — add `contactsUnread` query to layout load

## 3. Admin API Body Validation
- `admin/api/+server.ts` — replace `as string`/`Number()` with Zod schema
