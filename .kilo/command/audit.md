# /audit — Multi-Agent Project Audit

Run domain-specific audits in parallel. Each domain deploys its own agent.

## Usage

```
/audit [domain]
```

Domains: `framework`, `security`, `ui-ux`, `perf`, `coverage`, `full`, `quick`

## Domains

### `/audit framework` — PM Framework Compliance
Checks PM-specific rules:
- No `<style>` blocks in `.vue` files
- No `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`
- No `: any` types — must use `unknown` or proper types
- `catch` clauses use `(e: unknown)`
- No `!` non-null assertions
- No inline `style=` attributes
- No hardcoded hex colors outside `primitives.css`
- No CSS imports in section components
- No `v-html` without SAFE-RENDER comment
- Config/CSS color sync check (config.ts colors === primitives.css)
- Runs: `pm_review_run scope=quick`, `pm_lint`

### `/audit security` — Security Scan
- Secret/credential leaks in source
- Raw SQL outside Drizzle ORM (`db.run()`, `db.all()`, `.query(`)
- `innerHTML` or unescaped HTML injection
- `v-html` usage without sanitization
- Auth bypass patterns (missing `requireAuth`)
- CSRF token handling gaps
- Hardcoded passwords, API keys, tokens
- Outdated dependencies with known CVEs
- Rate limit configuration review

### `/audit ui-ux` — UI/UX & Accessibility
- a11y: missing alt text, ARIA labels, heading hierarchy, color contrast
- Keyboard navigation: tab order, focus trapping, skip links
- RTL layout correctness (logical properties, direction)
- Responsive breakpoints: mobile, tablet, desktop
- `prefers-reduced-motion` respect
- Form error states and validation feedback
- Loading/empty/error states for all components

### `/audit perf` — Performance
- Core Web Vitals (LCP, INP, CLS)
- Bundle size analysis (largest chunks, tree-shaking gaps)
- Image optimization (AVIF/WebP coverage, lazy loading)
- Font loading strategy (FOIT/FOUT, preload)
- Render-blocking resources
- Lighthouse score (mobile + desktop)

### `/audit coverage` — Test Coverage
- Test file count vs component count
- Test file count vs API route count
- Critical path coverage (auth, admin, public pages)
- Identify untested components and API routes
- Check if recent changes have corresponding tests

### `/audit full` — All Domains
Runs ALL five domain audits in parallel. Saves complete report to `docs/audit-YYYY-MM-DD.md`.

### `/audit quick` — Fast Pass
Runs only: lint + typecheck + framework compliance grep scan. No heavy tests, no Lighthouse, no Playwright. Should complete in < 30 seconds.

## Report Format

All audits produce a structured markdown report with:
- Domain header
- Pass/Fail summary
- Individual check results with file references
- Overall verdict (PASS / WARN / FAIL)
- Recommended fixes sorted by severity

## Dependencies

- PM MCP: `pm_review_run`, `pm_lint`, `pm_knowledge`, `pm_config_get`
- TAUSIK MCP: `tausik_verify`
- `gh` CLI (for security dependency checks)
- Playwright installed (for perf/UI-UA audits)
