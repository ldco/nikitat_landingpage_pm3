# PM3 i18n — Decision Record

**Status:** Decision reached
**Date:** 2026-08-07
**Decision:** Keep Paraglide. It's SvelteKit's official i18n add-on.

---

## 1. The Misdiagnosis

A previous agent claimed `[[lang]]` optional params never populating was a "confirmed SvelteKit bug." This was wrong. Root cause analysis:

- Paraglide's `reroute` hook strips language prefixes from URLs before SvelteKit route matching
- URL `/en/blog` → Paraglide extracts `en` → strips to `/blog` → SvelteKit matches `/blog` route → `params.lang` is undefined (because `[[lang]]` segment was stripped before matching)
- This is Paraglide working as designed, not a SvelteKit bug

## 2. Why Paraglide — No Analysis Needed

Paraglide is **SvelteKit's official i18n add-on**:

```
npx sv add paraglide="languageTags:ru,en,fr,he"
```

It is listed alongside drizzle, better-auth, tailwindcss, playwright, vitest — first-party supported integrations. There is no architectural decision to make. The framework uses the official tooling.

## 3. What Paraglide Provides

| Capability | Without Paraglide | With Paraglide |
|---|---|---|
| Message functions | Write `t('key')` — string-based, no autocomplete | `m.key_name()` — type-safe, compile-time errors |
| Bundle size | Full locale JSON shipped to client | 70% smaller via tree-shaking |
| Routing | Manual `[[lang]]` + `reroute` + `handle` | One line: `i18n.reroute()` + `i18n.handle()` |
| Locale detection | URL → cookie → browser → default (manual) | Built-in, configurable strategy chain |
| RTL direction | Manual `isRtl()` check in layout | Configured in `createI18n({ textDirection })` |
| SEO alternate links | Manual `<link rel="alternate">` generation | Built-in |
| Path exclusion | Manual hook logic | `exclude: ['/api/', '/admin/']` |
| Cookie persistence | Manual | Built-in |
| VSCode integration | None | Sherlock extension for inline translation editing |
| Web editor for translators | None | Fink editor |

## 4. Current Integration Health

| Component | Status | Notes |
|---|---|---|
| `@inlang/paraglide-sveltekit` | v0.16.1 | Working. Upgrade path exists. |
| `@inlang/paraglide-js` | v1.11.8 (transitive, via paraglide-sveltekit 0.16.1) | MIT-licensed, stable, 400K+ weekly downloads |
| Vite plugin | Active | Compiles `messages/*.json` → `$lib/paraglide/messages.js` |
| `reroute` hook | Active in `hooks.ts` | Correctly strips locale prefixes |
| `handle` hook | Active in `hooks.server.ts` | Sets `locals.paraglide.lang`, manages cookies |
| Message keys | ~350 × 4 locales | `messages/{ru,en,fr,he}.json` |
| Components | 24 files | `import * as m from '$lib/i18n'` — working |
| LangSwitcher | Working | Uses `i18n.route()` / `i18n.resolveRoute()` |

**No migration needed.** The framework is correctly using the official tooling.

## 5. Framework Considerations

For a framework, the relevant question is not "how hard is migration" — that's irrelevant. The question is:

> Does this dependency strengthen or weaken the framework?

**Paraglide strengthens PM3.** It provides capabilities (type-safe messages, tree-shaking, formatting) that would cost significant engineering effort to replicate, with worse results. It's officially endorsed by the Svelte team. It's used in production by Fortune 500 companies.

If Paraglide ever stops being supported, the compiled output (`$lib/paraglide/messages.js`) is plain JavaScript — it would continue working indefinitely. The migration path off Paraglide would be: extract message keys from the compiled functions, write a `t()` wrapper, done. No lock-in.

## 6. PM3 v2 → v3 Parity Note

PM3 v2 (Nuxt) used `@nuxtjs/i18n` — also a framework-adopted official i18n module. PM3 v3 (SvelteKit) using Paraglide is the equivalent architectural choice. No analysis needed on either.

