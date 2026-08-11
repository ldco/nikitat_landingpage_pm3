# Step 14: Expand FAQ, Features, Pricing Create/Edit Forms to Real Schema

## Why

All entity create forms capture only 1-2 fields while the real DB schemas support
rich multi-locale content. Fields must match the ACTUAL column names, not invented ones.

## Real Schemas (verified against `src/lib/server/db/schema.ts`)

### FAQ
- **Parent**: `faqItems` — `id`, `slug`, `category` (nullable), `published` (int bool), `order` (int)
- **Translations**: `faqItemTranslations` — `faqItemId` (FK CASCADE), `locale`, `question` (NOT NULL), `answer` (NOT NULL). UNIQUE `(faqItemId, locale)`.

### Features
- **Parent**: `features` — `id`, `slug`, `imageUrl` (nullable), `hoverImageUrl` (nullable), `category` (nullable), `published` (int bool), `order` (int)
- **Translations**: `featureTranslations` — `featureId` (FK CASCADE), `locale`, `title` (NOT NULL), `description` (nullable). UNIQUE `(featureId, locale)`.

### Pricing
- **Parent**: `pricingTiers` — `id`, `slug`, `name` (NOT NULL), `description` (nullable), `price` (int, nullable), `currency` (default 'USD'), `period` (enum: 'month','year','one-time', default 'month'), `featured` (int bool), `ctaText` (nullable), `ctaUrl` (default '/contact'), `order` (int), `published` (int bool)
- **Translations**: `pricingTierTranslations` — `tierId` (FK CASCADE), `locale`, `name`, `description`, `ctaText`. UNIQUE `(tierId, locale)`.
- **Features**: `pricingFeatures` — `id`, `tierId` (FK CASCADE), `text` (NOT NULL), `included` (int bool), `order` (int). `pricingFeatureTranslations` — `featureId`, `locale`, `text`. UNIQUE `(featureId, locale)`.

## What

For each entity (FAQ, Features, Pricing), expand the create/edit forms to expose all
real schema columns + per-locale translation fields. Follow the same pattern as
Step 13 (blog): transaction-wrapped writes, locale-filtered reads, upsert on edit.

## Prerequisites

- Step 02 (`AdminFormSection`)
- Step 05 (`FormField`)
- Step 13 (establishes the pattern → follow it)

## Common Rules for ALL Entity Forms

1. **Transaction wrapping**: Parent insert + all translation inserts in `db.transaction()`.
2. **Locale filter on reads**: All translation SELECTs filter `eq(locale, the locale resolved via `detectAdminLocale(event)`)`.
3. **Edit-time upsert**: Check `WHERE (entityId, locale)` → UPDATE if exists, INSERT if not.
4. **Real column names only**: Use `period` not `billingPeriod`, `imageUrl` not `icon`, etc.
5. **Form structure**: `PageHeader` + `AdminFormSection` for basic info + per-locale sections.
6. **Server load**: Load entity with translations for edit, load related data for selects.

## Implementation — FAQ

**Create form fields**:
- `slug` — text, required
- `category` — text (nullable, for now — no FK to categories table)
- `published` — checkbox
- `order` — number, default 0
- Per locale: `question` (text, required), `answer` (textarea, required for `faqItemTranslations.answer`)

**Server-side create**:
```typescript
db.transaction(() => {
  const item = db.insert(schema.faqItems).values({
    slug: parsed.slug, category: parsed.category || null,
    published: parsed.published ? true : false, order: parsed.order ?? 0,
    createdAt: new Date()
  }).returning({ id: schema.faqItems.id }).get()

  for (const loc of LOCALES) {
    const question = form.get(`question_${loc}`)?.toString()?.trim()
    const answer = form.get(`answer_${loc}`)?.toString()?.trim()
    if (question && answer) {
      db.insert(schema.faqItemTranslations).values({
        faqItemId: item.id, locale: loc, question, answer, updatedAt: new Date()
      }).run()
    }
  }
  return item.id
})
```

**Edit-time upsert**: Same pattern as blog — check `WHERE faqItemId AND locale`, UPDATE/INSERT.

## Implementation — Features

**Create form fields**:
- `slug` — text, required
- `imageUrl` — text (URL, NOT "icon")
- `hoverImageUrl` — text (URL)
- `category` — text (nullable)
- `published` — checkbox
- `order` — number, default 0
- Per locale: `title` (text, required), `description` (textarea)

**Server-side create**: Same transaction pattern as FAQ.

## Implementation — Pricing

**Create form fields**:
- `slug` — text, required
- `name` — text, required (base table field, NOT per-locale only)
- `description` — text (base table, nullable)
- `price` — number (integer, nullable)
- `currency` — select: USD, EUR, RUB (real options from the schema default 'USD')
- `period` — select: month, year, one-time (NOT "billingPeriod")
- `featured` — checkbox
- `ctaText` — text
- `ctaUrl` — text (default '/contact')
- `order` — number, default 0
- `published` — checkbox
- Per locale: `name` (translation override), `description`, `ctaText`
- Per tier: pricing features (`pricingFeatures` + `pricingFeatureTranslations`)
  — for this step, keep features as a simple text list (comma-separated per locale).
  Full CRUD for pricing features is future work.

**Translation fallback**: The `pricingTierTranslations` fields (`name`, `description`,
`ctaText`) are optional overrides. If a translation row exists but its `name` is null,
the base table `pricingTiers.name` is the fallback. Follow the service pattern:
`r.name ?? r.baseName` (see `getHomepageTiers()` in `pricing.ts`).

**Server-side create**:
```typescript
db.transaction(() => {
  const tier = db.insert(schema.pricingTiers).values({
    slug: parsed.slug, name: parsed.name,
    description: parsed.description || null,
    price: parsed.price ?? null, currency: parsed.currency ?? 'USD',
    period: parsed.period ?? 'month', featured: parsed.featured ? true : false,
    ctaText: parsed.ctaText || null, ctaUrl: parsed.ctaUrl ?? '/contact',
    order: parsed.order ?? 0, published: parsed.published ? true : false,
    createdAt: new Date(), updatedAt: new Date()
  }).returning({ id: schema.pricingTiers.id }).get()

  for (const loc of LOCALES) {
    const tName = form.get(`name_${loc}`)?.toString()?.trim()
    const tDesc = form.get(`description_${loc}`)?.toString()?.trim()
    const tCta = form.get(`ctaText_${loc}`)?.toString()?.trim()
    if (tName || tDesc || tCta) {
      db.insert(schema.pricingTierTranslations).values({
        tierId: tier.id, locale: loc,
        name: tName || null, description: tDesc || null, ctaText: tCta || null,
        updatedAt: new Date()
      }).run()
    }
  }

  // Pricing features (comma-separated for now)
  const featuresText = form.get('features')?.toString()?.trim()
  if (featuresText) {
    const features = featuresText.split(',').map(f => f.trim()).filter(Boolean)
    for (let i = 0; i < features.length; i++) {
      db.insert(schema.pricingFeatures).values({
        tierId: tier.id, text: features[i], included: true, order: i,
        createdAt: new Date()
      }).run()
    }
  }

  return tier.id
})
```

## i18n Keys Required

All field labels, select option labels, validation messages must be i18n keys:
- `admin.slug`, `admin.category`, `admin.published`, `admin.order`
- `admin.title`, `admin.description`, `admin.question`, `admin.answer`
- `admin.name`, `admin.price`, `admin.currency`, `admin.period`
- `admin.featured`, `admin.ctaText`, `admin.ctaUrl`
- `admin.imageUrl`, `admin.hoverImageUrl`
- Select values: `admin.periodMonth`, `admin.periodYear`, `admin.periodOneTime`

## Verification

```bash
npm run check

# Test each entity:
# 1. FAQ create: all fields present, per-locale question/answer, submit creates translations
# 2. FAQ edit: fields pre-filled, edit question, submit updates via upsert
# 3. Features create: slug + imageUrl + per-locale title/description
# 4. Pricing create: name + price + currency + period + per-locale overrides
# 5. Pricing edit: verify translation fallback works (base name shown when translation name is null)
# 6. For all: switch locale in admin, verify form shows correct translations
```

## Files to Modify

| File | Action |
|------|--------|
| `admin/faq/create/+page.svelte` + `+page.server.ts` | Expand to all fields |
| `admin/faq/[id]/edit/+page.svelte` + `+page.server.ts` | Same, pre-filled + upsert |
| `admin/features/create/+page.svelte` + `+page.server.ts` | Expand to all fields |
| `admin/features/[id]/edit/+page.svelte` + `+page.server.ts` | Same, pre-filled + upsert |
| `admin/pricing/create/+page.svelte` + `+page.server.ts` | Expand to all fields |
| `admin/pricing/[id]/edit/+page.svelte` + `+page.server.ts` | Same, pre-filled + upsert |
| `admin/portfolios/create/+page.svelte` | Add PageHeader + AdminFormSection (fields already good) |
| `admin/portfolios/[id]/edit/+page.svelte` | Add PageHeader + AdminFormSection |
