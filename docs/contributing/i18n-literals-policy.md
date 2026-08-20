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

## Framework-level translation content checks (any language set)

Beyond the literal guardrails, the framework validates the TRANSLATION DATA
itself — for ANY languages a project configures. The checks live in the
framework (no per-language hardcoding) and consume only the project's declared
locales (`LOCALES` / `DEFAULT_LOCALE` / `SECONDARY_LOCALE`) plus the data
itself.

| Check | Where | What it catches |
|---|---|---|
| Wrong-language text (script mismatch) | `npm run i18n:validate` (catalog) + pm3-validator check #14 (DB) | A value whose dominant **script** does not match its locale's script — French/Latin copy in a Hebrew row, English in Russian, Russian in English/French, Hebrew in Russian, … Any locale/script pair works via `scripts/lib/i18n-scripts.mjs` (memoized `Intl.Locale#maximize` → expected script vs Unicode `\p{Script=…}` counts). Short values (≤ 25 letters — proper nouns/brands) and code-like tokens (dotted keys, `snake_case`, `tag:name`, `{params}`, `G-XXXXXXXX` masks, URLs) are excluded. Latin-dominant values get a high lenience (≥ 85% foreign before flagging): correctly translated sentences dominated by brand names (`Google Analytics`, `Facebook Pixel`) are native text, not wrong-language copy. Distinctive non-Latin foreign scripts (Cyrillic in Hebrew, Hebrew in Russian, …) are judged strictly at the 50% majority rule. |
| Raw key instead of text | catalog + DB | A value equal to its key in dotted/underscore form, case-insensitive (`common.hello`, `common_hello`, `Common.HELLO`) renders raw at runtime. |
| Catalog key missing from DB (check #15) | pm3-validator | An `i18n/system-seed.json` key absent from the `translations` table (unless tombstoned via the admin editor) renders raw at runtime — run `npm run db:seed`. |
| Database integrity (check #16) | pm3-validator | Framework-wide DB health, not just translations: every table declared in `src/lib/server/db/schema.ts` must exist (missing migration), NOT NULL text columns must not hold empty values, and `PRAGMA foreign_key_check` must report no orphan rows. The DB is a first-class part of the framework — broken data fails the validator, never renders a broken site. |
| Untranslated gap (missing/blank) | catalog + DB | A key with text in some locales but missing/blank in another (per-key coverage across every configured locale; DB check covers admin edits to the translations table). |
| Untranslated copy | catalog | A non-default value identical to the default or secondary copy-source locale's value (allowlisted via `scripts/i18n-identical-allowlist.json`). |

The script check accepts a per-key allowlist for values that intentionally mix
scripts (technical copy with embedded English terms): add the dotted key to
`scripts/i18n-script-allowlist.json`. This only records the project's
deliberate exceptions — the detection itself stays framework-level.

The raw-key placeholder check (`isRawKeyValue` in `scripts/lib/i18n-scripts.mjs`) is a single shared implementation used by both validators, so trimming/casing normalization can never drift. `scripts/lib/i18n-scripts.mjs` is the single shared implementation used by both
the catalog validator and the pm3 validator, so the two surfaces can never
drift. Test coverage: `tests/i18n/i18n-scripts.test.ts` (module) and
`tests/i18n/system-seed-validation.test.ts` (catalog).

## How agents should add new UI text

The database is the runtime owner of ALL translations (PM v2 parity), and
`messages/*.json` are GENERATED artifacts — never edit them by hand. The
canonical catalog is `i18n/system-seed.json`:

1. Add the message key to `i18n/system-seed.json` for **every configured
   locale** (dotted key, e.g. `testimonials.next`). The default locale
   (`DEFAULT_LOCALE` in `src/project/site-config.ts`) must always be filled;
   other locales may be added later — the export regenerates the catalog
   with what exists.
2. Regenerate the Paraglide artifacts (messages + inlang settings) from the
   catalog and the config:
   `npm run i18n:export`
3. **Sync the catalog into the database:** `npm run db:seed`. This step is
   NOT optional for `admin.*` keys — they are DB-resident ONLY (excluded
   from the Paraglide catalog), so a key added to the catalog but never
   seeded renders as a RAW KEY in the admin UI. The pm3 validator check #15
   (catalog→DB drift) fails the build when a catalog key is missing from the
   translations table, so the "new key, no seed" bug is caught at commit
   time.
4. Reference it via `t('testimonials.next')` — the unified helper resolves the
   DB first (admin edits apply live) and falls back to the compiled message.
   NEVER import the Paraglide catalog directly (`import * as m from '$lib/i18n'`)
   in components — validator check #12 blocks it: the DB is the runtime owner.

Never hardcode a visible string to "make it work" — that is a regression this
rule exists to catch.
