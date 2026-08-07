# services/

Typed DB access layer. **Routes import services — never Drizzle directly.**

Each module owns the queries for one entity (blog, faq, features, pricing,
portfolio, contact, settings, translations, users).

**Rules:** every translation join MUST filter by locale. JSDoc on every export.

**Pattern to copy:** `blog.ts`. Add new entities per
`docs/contributing/adding-a-new-entity.md`.
