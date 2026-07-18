# PM Section CSS Rule — Zero by Default, Exception When Needed

Date: 2026-06-06
Status: ENGRAVED — framework rule.
Derivative scope: ALL PM projects, ALL AI agents (Kilo, Qwen, Claude, Codex).

## THE RULE

**Default: section components MUST NOT have their own CSS files.**

Custom CSS is the **exception** — only when the design genuinely cannot be expressed with existing global framework classes (`section`, `section-body`, `section-title`, `section-bg-alt`, `container`, `.section-grid-auto`, etc.).

When custom CSS IS genuinely needed, there are no property restrictions — use whatever CSS the design requires. The guardrail is the **justification**, not the property type. If you can justify why global classes aren't sufficient, you can use any CSS.

## DEFAULT APPROACH

By default, a section `.vue` should NOT:
- Create a file at `app/assets/css/ui/content/section-*.css`
- Create a file at `app/assets/css/runtime/section-*.css`
- Import any CSS: `import '~/assets/css/runtime/section-*.css'`
- Contain a `<style>` block
- Define custom BEM classes for text: `.card__title`, `.card__desc`, `.section__text`

## WHEN CUSTOM CSS IS OK

When the design truly cannot be expressed with global classes, create the section CSS file. Use any properties needed. The key requirement is:

1. First verify global classes are insufficient
2. If they are, write whatever CSS the design needs
3. If the pattern could benefit other sections, contribute it to the global CSS system instead

## WHY

1. **Typography must be consistent** across all sections. If each section defines its own `font-size`, `font-weight`, `color`, `line-height`, the site becomes a "font hooker club" with different text styles per block.
2. **The global cascade is the single source of truth.** `.section-body` provides canonical body text size/color/line-height. `<h1>`–`<h4>` from `base.css` provide canonical heading sizes. Adding per-section overrides breaks this contract.
3. **Reduced maintenance.** No orphan CSS files, no dead styles when a section is removed, no style conflicts.

## EXAMPLE: BAD vs GOOD

### BAD — section created its own CSS unnecessarily

```vue
<!-- SectionF22.vue -->
<script setup>
import '~/assets/css/runtime/section-f22.css'
</script>
```

```css
/* ui/content/f22.css */
.f22-card__title { font-size: var(--text-lg); color: var(--t-primary); }
.f22-card__desc { font-size: var(--text-sm); color: var(--t-secondary); }
```

### GOOD — only global classes + AtomsMadeBy

```vue
<!-- SectionF22.vue -->
<script setup>
const { t } = useI18n()
</script>

<template>
  <section id="f22" class="section section-bg-alt">
    <div class="container">
      <h2 class="section-title"><span>{{ t('f22.title') }}</span></h2>
      <div class="section-body">
        <AtomsMadeBy />
        <div v-html="t('f22.description')"></div>
      </div>
    </div>
  </section>
</template>
```

No CSS file. Zero custom classes. Everything cascades from the framework.

## RULE ENFORCEMENT

- All AI agents (Kilo, Qwen, Claude, Codex) MUST follow this rule.
- New sections default to zero CSS files. Only add a CSS file when global classes are genuinely insufficient — no property restrictions, just justify the need.
