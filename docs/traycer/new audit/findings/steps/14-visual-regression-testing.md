# Step 14 — Visual regression testing for section parity

> **Phase:** Long-term (Architectural maturity) | **Findings:** E-2 | **Severity:** Recommendation

## What this step is

Layer 1's audit marks visual/UX parity as "Unknown (runtime)" for every PM2→PM3 component because there is no automated screenshot comparison. This step wires up Playwright-based visual regression tests so a refactor of any section can be validated against screenshots.

## What we are doing

1. Verify/repair `playwright.config.ts` (it exists but its functional state was not confirmed in the audit).
2. Port the PM2 `e2e-playwright/` tests to PM3's Playwright setup.
3. Add screenshot-based visual regression tests for each homepage section (`SectionHero`, `SectionAbout`, `SectionFocus`, `SectionF22`, `SectionPortfolio`, `SectionContact`, plus data-backed sections) at mobile/tablet/desktop breakpoints.
4. Store baseline screenshots; fail on pixel diff beyond a threshold.

## Why

- Repo-verified gap — the audit could only mark visual parity as "unknown"; no automated check exists.
- For AI-driven development, a section refactor should be verifiable by "run the screenshot suite" rather than eyeballing.
- PM2 already has Playwright e2e tests (`e2e-playwright/`) that can be adapted, so this is porting work, not greenfield.

## Plan

### Task 1: Repair/verify Playwright setup

- **Files:** `playwright.config.ts`, `package.json` (playwright scripts/deps)
- **Change:** Confirm browsers installed, webServer config (dev or preview), and a `test:e2e` npm script. Fix any config breakage.

### Task 2: Port PM2 e2e tests

- **Files:** new `e2e/` (or `tests/e2e/`) ported from PM2 `e2e-playwright/`
- **Change:** Adapt PM2's flows (section rendering, navigation, admin login) to PM3 selectors/routes.

### Task 3: Add screenshot baselines

- **Files:** `e2e/sections.spec.ts`, `e2e/__screenshots__/**`
- **Change:** Capture baselines for each enabled homepage section at 3 breakpoints; use `toHaveScreenshot()` with a diff threshold.

### Task 4: Wire into CI (after Step 11)

- **File:** `.github/workflows/ci.yml`
- **Change:** Add an optional e2e job (or on-demand workflow) so screenshot diffs fail the PR.

## Verification

- [ ] `npx playwright install` — browsers present
- [ ] `npm run test:e2e` — ported flows pass against a local server
- [ ] Baseline screenshots generated for all enabled sections
- [ ] A deliberate 1px CSS change to a section fails the screenshot test (proves sensitivity)
- [ ] Runs in CI (if wired): screenshot job passes on clean PR

## Notes / Risks

- Keep baselines in-repo but regeneratable (`--update-snapshots`); document the update command so agents don't get stuck on stale baselines.
- Screenshot tests are flaky-prone (fonts, animations). Disable animations in the test config and use `--disable-animations`-style hooks; run scroll-triggered reveal sections with animations off.
- PM2 has scroll-reveal animations; the PM3 sections use the reveal action — tests must wait for/disable reveals deterministically.
