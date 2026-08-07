# molecules/

Compose atoms into reusable units: SectionHeading, PricingCard, BlogPostCard,
ContactInfo, NavLinks. May hold local UI state, never fetch data.

**Rules:** receive data via props. Accept `class?: string` + twMerge. JSDoc required.

**Pattern to copy:** `BlogPostCard.svelte` (props + i18n + twMerge).
