# PM MadeBy i18n Localization Fix

Date: 2026-06-07
Status: ENGRAVED — framework fix.

Derivative scope: all PM projects.

## Problem

`app/components/atoms/MadeBy.vue` used a hardcoded `footerMadeBy.text` from the config to render the "Made by" attribution text. This meant:

```typescript
const text = computed(() => footerMadeBy.text.trim())
```

The text was always in English regardless of the current locale. Even though `footer.madeBy` translations existed in the database (or system-seed.json), the component never used them.

## Fix

Two changes:

### 1. MadeBy component (`atoms/MadeBy.vue`)

Changed the `text` computed to check i18n first, fall back to config:

```typescript
const { t, te, locale } = useI18n()

const text = computed(() => {
  if (te('footer.madeBy')) return t('footer.madeBy')
  return footerMadeBy.text.trim()
})
```

This way:
- If `footer.madeBy` translation exists in the database → use it (localized)
- If no translation exists → fall back to `footerMadeBy.text` from config (static)

### 2. Translation entries

Added `footer.madeBy` keys to `i18n/system-seed.json` for all project locales:

| Locale | Key | Value |
|--------|-----|-------|
| en | footer.madeBy | Made by |
| ru | footer.madeBy | Сделано в |
| fr | footer.madeBy | Créé par |
| he | footer.madeBy | נבנה על ידי |

## Why This Is a Framework Issue

- The `MadeBy` component ships with every PM project
- PM supports multi-language with RTL, so every component should respect locale
- Hardcoded English text in the footer attribution is inconsistent with the framework's i18n architecture
- The fix is a one-line change in the computed property + translation entries in system-seed.json

## Future

If a project needs a custom attribution text that differs from the translation key, they can:
1. Omit the `footer.madeBy` translation → component uses `footerMadeBy.text` from config
2. Or set `footerMadeBy.text` to empty and use the `footer.madeBy` translation exclusively
