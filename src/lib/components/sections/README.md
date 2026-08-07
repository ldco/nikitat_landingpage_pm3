# sections/

Full-viewport homepage regions with `id` for anchor nav: Hero, About, Blog,
Portfolio, FAQ, Features, Pricing, Contact, Team, Testimonials, Clients.

**Rules:** rendered via `SectionRenderer` from the registry (`registry.ts`).
Content comes typed from `+page.server.ts` via `SectionContent` (types.ts).
Every section handles empty state. Never fetch data internally.

**Pattern to copy:** `SectionBlog.svelte`.
