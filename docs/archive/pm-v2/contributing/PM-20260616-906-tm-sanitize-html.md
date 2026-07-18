# PM Contribution

## Meta
- ID: PM-20260616-906
- Type: enhancement
- Priority: medium
- Created: 2026-06-16
- Source: Client Project

## Summary
`tm()` + `sanitizeHtml()` pattern for HTML-rich translations without vue-i18n warnings

## Problem
vue-i18n `t()` compiles messages and warns when the translation value contains HTML tags (`[intlify] Detected HTML in '...' message. Recommend not using HTML messages to avoid XSS.`). The `f22.description` translation contains `<a>` links which trigger this warning. Using `warnHtmlInMessage: 'off'` just silences the symptom without fixing the root cause.

## Solution
Use `tm()` (translate message) instead of `t()` for translations that contain HTML. `tm()` returns the raw message value without going through the message compiler, so no HTML detection warning occurs. Combine with `sanitizeHtml()` before `v-html` rendering for XSS safety.

### Pattern

```typescript
import { sanitizeHtml } from '~/utils/sanitize'
const { t, te, tm } = useI18n()

const description = computed(() => {
  if (!te('f22.description')) return ''
  const raw = tm('f22.description')
  if (!raw) return ''
  return sanitizeHtml(raw as string)
})
```

```html
<div v-if="description" v-html="description"></div>
```

## Domains Affected
- [x] Frontend

## Files Changed
### Modified: `app/components/sections/SectionF22.vue`
- Added `tm` to `useI18n()` destructuring
- Changed `description` computed from `t('f22.description')` to `tm('f22.description')` + `sanitizeHtml()`

## Dependencies
None

## Breaking Changes
None

## Testing
1. Visit `/#f22` in light and dark theme
2. Verify description renders with clickable links
3. Verify no `[intlify] Detected HTML` warning in console
4. Verify `sanitizeHtml()` strips any disallowed tags/attributes

---
*Copy this file to the PM framework repository and use `pm_contribute_apply` to apply.*
