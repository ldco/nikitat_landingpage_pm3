# atoms/

Single-responsibility primitives: Logo, Card, Button, Badge, Loading*, NavLink.

**Rules:** no children, no state, no `fetch`. Every visible component accepts
`class?: string` merged via `twMerge(clsx(base, className))`. JSDoc with
`@props` + `@example` required.

**Pattern to copy:** `Container.svelte` or `CtaButton.svelte`.
