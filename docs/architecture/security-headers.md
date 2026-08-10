# Decision — Security response headers: framework-owned vs helmet

**Status:** Decided (2026-08-10) — framework-owned `headers.ts`
**Applies to:** `src/lib/server/security/headers.ts`, `svelte.config.js` (`kit.csp`)

## Context

The audit (finding CS-1) found two missing response headers
(`Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`). During
remediation the question was raised whether to hand-roll these headers at all,
or use a library such as `helmet` / `sveltekit-security-headers` / `sveltekit-helmet`.

## Options considered

| Option | Pros | Cons |
|--------|------|------|
| `helmet` (+ `sveltekit-helmet` wrapper) | Battle-tested defaults, broad header set | Its centerpiece is CSP, which we must DISABLE (SvelteKit owns it via `kit.csp`); defaults still need overriding (HSTS preload, Permissions-Policy); adds a middleware dependency to every derived project |
| `sveltekit-security-headers` | SvelteKit-native | Same CSP overlap; small static set is trivial to own |
| Framework-owned `headers.ts` | CSP stays delegated to SvelteKit; the remaining 8 headers are constant values (no logic); statically verifiable by pm3-validator; zero dependency risk for framework reuse | We maintain this small module ourselves |

## Decision

Keep the framework-owned `src/lib/server/security/headers.ts`.

Rationale:

1. **CSP is already delegated to the framework.** The difficult, security-critical
   part (nonce-based CSP) is handled by SvelteKit's built-in `kit.csp`
   (`svelte.config.js`, `mode: 'nonce'`). This is the "don't reinvent" choice for
   the algorithmic part.
2. **The remaining 8 headers are values, not logic.** COOP/CORP/HSTS/Permissions-Policy
   are a static set of constants — no algorithm, no parsing, no nonce handling.
   A library's main value (CSP) would have to be disabled, and its defaults would
   still need overriding.
3. **Framework reuse.** PM3 is a framework other projects build on. A deterministic,
   dependency-free, validator-checked header module is lower-risk than pulling a
   middleware dependency into every derived project.
4. **Validator integration.** The pm3-validator can statically assert the header set
   (e.g., "COOP and CORP must be present"), which a dependency cannot expose to
   static analysis.

## Trade-offs accepted

- We maintain a small header module ourselves.
- Mitigation: it is declarative (a single `DEFAULT_SECURITY_HEADERS` record + a
  tiny `Headers` builder); no logic beyond merging constants.
- If the module ever grows real logic (nonce handling, dynamic directives),
  revisit `helmet` at that time.

## Consequences

- CSP remains owned by SvelteKit; `hooks.server.ts` must not override it.
- Header additions are one-line changes to `DEFAULT_SECURITY_HEADERS`.
- The validator should assert COOP/CORP presence (see Step 02 verification).
