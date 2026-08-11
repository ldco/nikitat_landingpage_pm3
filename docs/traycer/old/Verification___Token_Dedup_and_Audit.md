I have the following verification comments after thorough review and exploration of the codebase. Implement the comments by following the instructions in the comments verbatim.

---
The context section for each comment explains the problem and its significance. The fix section defines the scope of changes to make — implement only what the fix describes.

## Comment 1: `src/app.css` still defines the z-index scale twice, so the token source of truth is not actually deduplicated.

### Context
This leaves the exact problem called out by the ticket unresolved: the same z-index tokens are still declared once at lines 128-138 and again at lines 239-250 in `src/app.css`. Keeping duplicate declarations inside the same `@theme` block preserves ambiguity for future edits, documentation generation, and any validator that expects a single canonical definition. The ticket explicitly requires removing the duplicate block and keeping exactly one definition of each z-index token in a sensible location.

### Fix

In `/run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/app.css`, remove one of the duplicated `--z-base` through `--z-toast` blocks and keep a single canonical z-index section in the `@theme` block. Preserve `--z-hamburger` if it is still needed, but ensure each z-index token name is declared exactly once.

### Referred Files
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/app.css
---
## Comment 2: The legacy alias tokens are still present even though no actual code consumers were found anywhere in the runtime source tree.

### Context
The ticket requires a full usage audit for `--color-pm-bg-muted`, `--color-pm-bg-dark`, `--color-pm-bg-dark-muted`, and `--color-pm-muted-dark`, with unused aliases deleted and used aliases kept only with an inline tracking comment naming the consuming files. A repo-wide grep over `*.svelte`, `*.css`, `*.ts`, and `*.js` only found these names in their declarations inside `src/app.css`; no component or script usage was found. Leaving them in place under a generic 'kept for component compat' comment means the audit outcome has not been applied, and the file still advertises compatibility aliases that currently have no verified consumers.

### Fix

In `/run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/app.css`, remove `--color-pm-bg-muted`, `--color-pm-bg-dark`, `--color-pm-bg-dark-muted`, and `--color-pm-muted-dark` if there are truly no runtime references. If you discover a real consumer outside the current grep scope, keep only the referenced aliases and add an inline comment on each retained declaration that explicitly names the consuming file path(s) and states that the alias is legacy and scheduled for removal after migration.

### Referred Files
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/app.css
---
## Comment 3: The required token inventory deliverable is missing, which blocks the follow-on token-reference documentation work.

### Context
The acceptance criteria and ticket description require a full markdown inventory covering every token remaining in `src/app.css`'s `@theme` block and `src/project/theme.css`, saved as `docs/traycer/token-inventory.md`. That file does not exist in the repository, and `docs/traycer` currently only contains the handoff/spec documents. Without this artifact, the execution is incomplete and the later token-reference-doc ticket has no generated inventory to consume.

### Fix

Create `/run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/docs/traycer/token-inventory.md` and populate it with the full post-cleanup token inventory from both `/run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/app.css` and `/run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/project/theme.css`, listing token name, category, and one-line purpose for every remaining token.

### Referred Files
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/docs/traycer
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/app.css
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/project/theme.css
---