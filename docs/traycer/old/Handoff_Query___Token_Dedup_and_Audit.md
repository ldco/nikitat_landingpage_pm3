I have the following user query that I want you to help me with. Implement the requested functionality following best practices.

Implement ticket:0c552a53-7745-488c-902f-35477413f845/04de766e-c65e-4042-bd15-69c9b34594f6 ("Audit and Deduplicate Design Tokens in app.css and theme.css") per spec:0c552a53-7745-488c-902f-35477413f845/e73ed947-d820-4218-83bd-e05617be7348 §1.

Context: file:/run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/app.css currently defines the z-index scale (--z-base, --z-dropdown, --z-sticky, --z-fixed, --z-drawer-backdrop, --z-drawer, --z-modal-backdrop, --z-modal, --z-popover, --z-toast) TWICE, identically, within the same @theme block (once around line 128-138, again around line 239-250). Remove the duplicate block, keeping exactly one definition of each z-index token in a sensible location within @theme.

Also audit these "kept for Phase 4+ compat" legacy alias tokens currently in src/app.css's @theme block: --color-pm-bg-muted, --color-pm-bg-dark, --color-pm-bg-dark-muted, --color-pm-muted-dark. For each:

- Search the entire codebase (not just .svelte — also .css, .ts, .js) for actual usage.
- If unused anywhere, delete the token declaration.
- If still referenced, keep it but add an inline comment noting it's legacy/scheduled for removal once the referencing component is migrated (reference which file(s) use it).

Also review file:/run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/project/theme.css for any additional duplicate or legacy alias primitives following the same rules (deduplicate exact duplicates; flag/comment legacy aliases that are still referenced; delete genuinely unused ones).

Do NOT touch or remove any @utility classes, @layer components blocks, or rewrite file:/run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/AGENTS.md — those are explicitly out of scope for this ticket (handled by separate tickets).

Finally, produce a full token inventory as a markdown list (token name, category e.g. color/spacing/typography/shadow/radius/z-index/transition, one-line purpose) covering every token remaining in src/app.css's @theme block and file:/run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/project/theme.css after this cleanup. Save this inventory as a new file at docs/traycer/token-inventory.md so it can be consumed by the token-reference-doc ticket later.

Acceptance criteria:

- No duplicate token declarations remain in file:/run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/app.css or file:/run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/project/theme.css
- Every remaining legacy alias has a documented reason (still-used + tracking comment, or removed)
- docs/traycer/token-inventory.md exists with the full token inventory

### Context for the mentioned epic items:

#### Epic (/tmp/traycer-epics/0c552a53-7745-488c-902f-35477413f845-Aligning_SvelteKit+Tailwind_Framework_with_Nuxt+Custom_CSS_Version)
<specs>
 - e73ed947-d820-4218-83bd-e05617be7348-PM3_Bulletproof_Style_System_—_Tokens-Only_CSS_Architecture.md
</specs>
<tickets>
 - 04de766e-c65e-4042-bd15-69c9b34594f6-Audit_and_Deduplicate_Design_Tokens_in_app.css_and_theme.css.md
</tickets>