# i18n Literals Policy — No Untranslated Regressions

Framework rule: **every user-facing string in framework and project UI files
must come from the i18n layer** — either the unified `t()` helper
(`$lib/stores/content.svelte`) or the Paraglide catalog (`m.*()` from
`$lib/i18n`). This is an enforceable rule, not a guideline.

## Enforcement

`scripts/pm3-validator.mjs` check #10 scans every `.svelte` file under `src/`
plus `src/app.html` and extracts user-facing string literals:

- plain text nodes (`>Some text<`)
- `aria-label`, `title`, `placeholder`, `alt` attributes
- `|| 'literal'` / `?? 'literal'` fallback strings

Check #10b extends the same guard to **approved TypeScript config surfaces**
that feed UI output (`TS_CONFIG_SCAN_FILES` in the validator — currently
`src/project/site-config.ts`). In those files the scan flags label-like string
literals: multi-word phrases (`Contact us today`), Title-case single words
(`Name`, `Email`, `Message`), and words with non-ASCII letters. Add a project
config file to `TS_CONFIG_SCAN_FILES` when it starts feeding visible strings.

Any literal **not present in `scripts/i18n-literal-baseline.json`** fails the
validator (and therefore `lint-staged` on commit).

The baseline freezes the literal inventory that existed before this rule was
introduced — it is technical debt, to be removed file-by-file as admin pages
are translated. Regenerating it with `node scripts/pm3-validator.mjs
--update-baseline` is a code-review-gated action: it must only ever shrink,
never grow with new literals.

## Allowed Exceptions (the complete list)

| Exception | Example | Why |
|---|---|---|
| No letters (numbers/punctuation) | `'9+'`, `'?'`, `'×'`, `'—'` | Not translatable text |
| Single-letter initials / brand marks | `'P'` | Logo/avatar mark |
| i18n keys / identifiers / slugs | `'admin.dashboard'`, `'pm-session'` | Keys are the i18n layer itself |
| SvelteKit template placeholders | `%sveltekit.body%`, `%paraglide.lang%` | Framework template syntax |
| Explicit fallback as 2nd arg of `t()` | `t('footer.madeByLogoAlt', 'Fabrica 22')` | Documented fallback chain (proper nouns only) |
| Class names / URLs / paths / emails | `class="..."`, `href="https://…"`, `'/uploads/x.png'` | Not user-facing text |
| ISO language codes / locale keys | `ru-RU`, `en-US` | Config identifiers |
| Compound PascalCase identifiers | `SectionAbout`, `SectionF22` | Component/config references, not text |
| Locale display endonyms | `'English'`, `'Русский'`, `'עברית'` in `LOCALE_CONFIG` | Languages are conventionally named in their own language; frozen in the baseline |

Everything else — headings, labels, button text, aria labels, alt text,
placeholders, error messages, empty-state copy — MUST be a translation key.

## How agents should add new UI text

1. Add the message key to **all four** locale files under `messages/`
   (`ru`, `en`, `fr`, `he`) — snake_case name, e.g. `testimonials_next`.
2. Recompile the catalog:
   `npx paraglide-js compile --project ./project.inlang --outdir ./src/lib/paraglide`
3. Reference it via `m.testimonials_next()` or `t('testimonials.next')`
   (the dotted form resolves to the compiled message automatically).

Never hardcode a visible string to "make it work" — that is a regression this
rule exists to catch.
