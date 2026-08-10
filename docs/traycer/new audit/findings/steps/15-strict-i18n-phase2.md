# Step 15 — Strict i18n literal enforcement (Phase 2)

> **Phase:** Long-term (Architectural maturity) | **Findings:** E-1 | **Severity:** Recommendation

## What this step is

PM3 already enforces "no NEW untranslated literals" via the frozen baseline (`scripts/i18n-literal-baseline.json`, 104 lines / ~20 files). But the baseline itself is technical debt — 17 of 20 tracked files are admin pages with English UI labels. This step adds a strict mode that forces the baseline to shrink to zero.

## What we are doing

1. Add a `--check-strict` mode to the validator that **fails on ANY literal present in the baseline** (not just new ones).
2. Add an `npm run i18n:translate-baseline` helper that lets an agent chip away at the baseline in small batches: pick a key, translate it via the i18n layer, remove it from the baseline, verify.
3. Track baseline size over time (a "baseline count" in CI or a doc metric) so it can only decrease.

## Why

- E-1 rationale: the baseline currently creates ambiguity — an agent sees a string in `i18n-literal-baseline.json` and can't tell if it's "approved" or "debt". The policy doc (`docs/contributing/i18n-literals-policy.md`) says the baseline must only shrink, but nothing enforces shrinking.
- Moving to zero untranslated strings removes the last category of hardcoded UI text, aligning with the project's strict i18n rule.

## Plan

### Task 1: Add `--check-strict` to the validator

- **File:** `scripts/pm3-validator.mjs` (check #10 / #10b)
- **Change:** Add a strict flag that treats any baseline-listed literal found in the scanned files as a violation (i.e., the baseline must be empty). Keep the current behavior as the default (regression-only).

### Task 2: Add the translate-baseline helper

- **File:** new `scripts/translate-baseline.mjs` (or extend the validator)
- **Change:** List baseline entries with their file/line, group by file, and suggest i18n keys; after a key is translated and removed from the baseline, re-run the validator to confirm.

### Task 3: Batch-reduce the baseline

- **Files:** the 17 admin pages in the baseline, `scripts/i18n-literal-baseline.json`
- **Change:** Translate the most visible admin labels first (Dashboard, Users, Published, Draft, etc.) into the i18n layer; remove them from the baseline. Work in small batches, each verified by `npm run validate:pm3` and `npm run check`.

### Task 4: Enforce in CI

- **File:** `.github/workflows/ci.yml` (after Step 11)
- **Change:** Run `npm run validate:pm3 -- --check-strict` as an informational/failing job (or a separate badge job) so the baseline cannot regrow.

## Verification

- [ ] `npm run validate:pm3 -- --check-strict` fails while baseline is non-empty (proves the gate works)
- [ ] After translating one batch, baseline shrinks and the strict check passes for the remaining set
- [ ] Admin UI shows translated labels in all 4 locales (ru, en, fr, he)
- [ ] `npm run check`, `npm run lint`, `npm test` pass after each batch
- [ ] Baseline file ends at zero entries (final state)

## Notes / Risks

- Do NOT run `--check-strict` in the standard pre-commit hook until the baseline reaches zero — otherwise every commit fails. Make it opt-in (CI or explicit command) until then.
- Some baseline entries are intentionally non-translatable (brand name "Puppet Master", "Story" scene label). The policy's allowed-exceptions list must stay intact; strict mode should exclude those.
- Translating admin labels touches many files; batch by page and verify each batch independently.
