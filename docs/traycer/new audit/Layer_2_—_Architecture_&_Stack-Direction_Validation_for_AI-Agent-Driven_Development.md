# Layer 2 — Architecture & Stack-Direction Validation for AI-Agent-Driven Development

## Scope

Evaluate whether the current PM3 stack (SvelteKit, Tailwind v4 token system, Drizzle ORM, Paraglide i18n, Zod, Vitest/Playwright) is genuinely the best fit for AI-agent-driven development, per spec:655a5dd7-1ae7-42b5-8b82-11c1cd095482/b258627c-201b-4ee1-bb52-966d9bdd2135 Layer 2, with an explicit mandate to critique and propose alternatives where warranted (not validate-only).

**In scope:**

- For each major dependency in file:package.json (SvelteKit, Svelte 5 runes, Tailwind v4, Drizzle, `@inlang/paraglide-sveltekit`, Zod, `sveltekit-superforms`), assess against AI-driven-dev criteria: predictability/absence of implicit "magic," explicitness of data flow, ease of static analysis and lint enforcement, and quality of automated guardrails (file:scripts/pm3-validator.mjs, file:eslint.config.js, file:eslint-plugin-ssr-safety.js).
- Where a choice is judged suboptimal, name a concrete alternative and its trade-off — not a generic "consider X."
- Assess whether the framework/project segregation model (file:docs/framework-project-boundary.md) is architecturally sound and actually enforced (cross-reference findings from the Code Inventory ticket on `SectionRenderer` and registry patterns), and whether the aspirational `@puppet-master/core` package boundary (mentioned at the end of that doc) is realistic or should be revised.
- Assess AI-agent tooling maturity: are file:AGENTS.md, `docs/contributing/*` rule docs, and the PM3 validator's enforcement checks (duplicate tokens, canonical-primitive bypass, i18n literal baseline, etc.) sufficient and low-drift-risk, or do they need strengthening.

**Out of scope:** security-specific stack decisions (owned by Security ticket); infra/deploy stack decisions (owned by DevOps ticket).

## Deliverable

A findings section with a verdict per stack choice (Aligned / Aligned-with-caveats / Reconsider) plus a "top 5 architectural risks for AI-driven development" list, each with a proposed direction and severity tag.

## Spec References

spec:655a5dd7-1ae7-42b5-8b82-11c1cd095482/b258627c-201b-4ee1-bb52-966d9bdd2135 — Layer 2, Severity model

## Dependencies

None — can start immediately. Benefits from reading Layer 1's framework/project-segregation findings if available, but does not block on them.