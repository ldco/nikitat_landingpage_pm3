# Philosophy: AI-First Framework Design

**Supersedes:** Puppet Master Human-First philosophy  
**Date:** 2026-07-18  
**Status:** Foundation Document — All decisions derive from this  

---

## 1. The Core Insight

The original Puppet Master was designed for **a human developer sitting at a keyboard.**

Every architectural decision was made to make the *human* faster:
- Nuxt for hireability
- Pure CSS because "humans know CSS"
- Atomic Design 5-layer hierarchy for mental organization
- Config-as-a-Product so human can see the whole project at once
- Framework = Website so human doesn't need to manage library boundaries

**This is no longer the constraint.**

In 2026, the primary developer is not a human — it is an **AI agent**.  
The human's role shifts from *writing code* to *directing agents, reviewing output, and making high-level decisions.*

---

## 2. The New Constraint

> **Optimize for the AI's "brain," not the local job market.**

An AI agent is simultaneously:
- **Incredibly capable** — reads entire codebases, writes thousands of lines, knows every library
- **Fragile** — g​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​loses context, hallucinates APIs, forgets file paths, invents class names that don't exist

**If the AI can't hold the context, the AI will write broken code.**

---

## 3. The Principles

### Principle 1: Brutal Explicitness

**An AI must never have to guess.**

| Anti-pattern (Human-First) | Pattern (AI-First) |
|---------------------------|-------------------|
| Auto-imports (`definePageMeta`, `defineEventHandler`) | Explicit imports (`import { x } from 'y'`) |
| Hidden state (Pinia, reactive, Vuex) | Visible state (`$state`, `$derived`) |
| Magic file-based routing (Nitro) | Explicit exports (`export async function GET`) |
| Inferred types | Explicit types (Zod on every boundary) |
| Config-as-magic (1019-line config) | Config-as-data (JSON/TS, validated by schema) |

**Rule:** If the AI can hallucinate it, make it explicit.

### Principle 2: Minimum Context Window

**An AI should never need to remember more than one file to understand one component.**

| Anti-pattern | Pattern |
|-------------|---------|
| Component in `.vue`, styles in `assets/css/skeleton/header.css`, tokens in `colors/primitives.css`, responsive in `layout/responsive.css` | **Component + Styles together** (Tailwind — all in `.svelte`) |
| Logic in `composables/useX.ts`, template in `components/X.vue`, types in `pm-core/app/types/X.ts` | **Colocate by feature** (types + logic + component together when possible) |
| Setup across 6 Nuxt modules | All config in one typed file |

**Rule:** One component = one file. One feature = one directory. No scatter.

### Principle 3: Standard Web APIs Over Framework Magic

**An AI has been trained on the standard web platform. Use it.**

| Task | Nuxt/Nitro Way | SvelteKit Way | Why AI wins |
|------|---------------|---------------|-------------|
| Handle request | `defineEventHandler(async (event) => { ... })` | `export async function GET(event) { ... }` | AI knows HTTP verbs, not Nuxt helpers |
| Read query params | `getQuery(event)` | `url.searchParams` | AI knows URL API |
| Read body | `readBody(event)` | `await event.request.json()` | AI knows Request API |
| Set cookie | `setCookie(event, ...)` | `event.cookies.set(...)` | AI knows Cookie API |
| Send response | `return { data }` | `return json({ data })` | Explicit JSON response |
| Auth check | `requireAuth(event)` (custom) | `event.locals.user` + hooks | Standard middleware pattern |
| Form handling | Nitro + manual | SvelteKit form actions | Built-in framework feature |
| Error handling | `createError({ statusCode })` | `error(404, 'msg')` | SvelteKit built-in |

**Rule:** Favor `fetch`, `Request`, `Response`, `URL`, `Headers`, `FormData` over framework wrappers.

### Principle 4: Predictable File Structure

**An AI navigates by pattern, not by memory.**

```
src/
  routes/api/     → HTTP endpoints (GET, POST, PUT, DELETE)
  routes/admin/   → Admin pages
  lib/components/ → Reusable UI
  lib/server/     → Server-only logic (DB, auth, utils)
  lib/stores/     → Client state (.svelte.ts runes)
```

**Rule:** The path to a file tells the AI *exactly* what kind of code is inside. No surprises.

### Principle 5: Flat Over Nested

**Every level of nesting is a chance for the AI to lose track.**

**Hierarchy (current PM):**
```
atoms/ → molecules/ → organisms/ → sections/ → pages/
  ├── 5 directory levels
  ├── 51 files
  └── AI must ask: "Is this an organism or a molecule?"
```

**Hierarchy (target):**
```
components/
  ├── ui/          → Reusable UI (buttons, cards, inputs, modals)
  ├── sections/    → Page sections (hero, about, portfolio, etc.)
  └── portfolios/  → Portfolio viewers (branding, brandbook, website)
  └── admin/       → Admin-specific components (data tables, forms)
```

**Rule:** Max 3 directory levels from `src/`. If it's deeper, it's a separate concern.

### Principle 6: Document Boundaries, Not Implementation

**The AI reads the docs once. The AI writes the code many times.**

Document *what* and *why*, not *how*.

| Document | Covers | Doesn't cover |
|----------|--------|---------------|
| PHILOSOPHY | Principles, reasoning | Implementation details |
| ARCHITECTURE | Module boundaries, data flow | Library API docs |
| PART1_SPEC | File inventory, acceptance criteria | Exact code to write |

**Rule:** Never document what the AI can infer from type definitions and library docs.  
Document what the AI *can't* infer: decisions, rationale, conventions.

### Principle 7: Security by Architecture, Not by Checklist

**An AI that forgets the security checklist writes vulnerable code.**

Instead of "remember to add CSRF validation," make CSRF validation **automatic**:

```ts
// hooks.server.ts — one place, EVERY request
if (isMutationMethod(request.method)) {
  validateCsrf(request)  // Always runs. AI can't forget it.
}
```

Same for:
- CSP headers → in hooks, always applied
- Rate limiting → in hooks, per-IP tracked
- Audit logging → in hooks, automatically logs security events
- Zod validation → required by architecture, enforced by types

**Rule:** Security is infrastructure, not a feature. If the AI has to *remember* security, security will fail.

---

## 4. What This Means in Practice

### For the developer (human)

You don't write code anymore. You:
1. **Define intent** — "I want portfolio items to support video"
2. **Review output** — "This query has an N+1, fix it"
3. **Set constraints** — "Use $state not $store for this"
4. **Accept/Reject** — "This is correct, ship it"

### For the AI agent

You write code with **maximum confidence** because:
- No hidden state you can't see
- No auto-imports you might miss
- No scattered CSS to track
- No 5-level hierarchy to navigate
- All security is in one hooks file
- All DB queries are in one schema
- All types are explicit

### For the framework

The framework is not a product. It's a **scaffold + conventions** that produce safe, fast, correct output when operated by an AI.

---

## 5. What Carries Over from PM

| Feature | Why keep |
|---------|----------|
| **Database-driven i18n** | Content is content, not code. AI reads from API, doesn't edit translations |
| **Config-driven modules** | AI needs a single source of truth for what's enabled/disabled |
| **RBAC with hierarchy** | Simple, well-understood, AI can implement without bugs |
| **API envelope** | `{ success: true, data }` — simple, consistent, AI can't mess it up |
| **Atomic Design (spirit)** | Components should be composable. Just not 5 layers of them |
| **Session-based auth** | Standard, well-documented, works everywhere |
| **GSAP + Three.js** | Framework-agnostic, AI reads their docs directly |

---

## 6. What Changes

| Change | Why |
|--------|-----|
| **Nuxt → SvelteKit** | No magic, explicit code, standard web APIs |
| **Pure CSS → Tailwind** | AI knows Tailwind, no context-switch to CSS files |
| **5-layer Atomic → 3-level components** | Less nesting = less AI confusion |
| **Pinia → Svelte runes** | `$state` is just a variable. No store boilerplate |
| **Nitro → SvelteKit server** | `+server.ts` is just `export async function GET`. AI knows HTTP. |
| **Separate repos → later** | First: working app. Later: extract library. |

---

*This document is the foundation. Every architectural decision in this migration must trace back to one of these 7 principles.*
