# PM v3 — Актуальное Состояние (2026-07-19)

**Цель:** Миграция PM v2 (Nuxt) → PM v3 (SvelteKit).
**Навигация:** `README.md` → `PLAN.md` → `CSS-ARCHITECTURE.md` → `CSS-EDGECASES.md` → `CSS-FULL-AUDIT.md` → `ARCHITECTURE.md`

---

## 1. СТАТУС

| Аспект | Статус | Детали |
|--------|--------|--------|
| **CSS framework (app.css)** | ✅ 781 строка | @theme + @layer base (reset, :root, dark, browser hacks) + @layer utilities (safe-area) + @layer components (hamburger) + @keyframes |
| **Sections (13 штук)** | ✅ Visual parity | TheHeader, TheFooter + 13 секций. Tailwind-only, 0 CSS классов |
| **Config-driven widths** | ✅ 20 файлов | headerFooterWidthMode + bodyWidthMode |
| **Feature-flag checks** | ✅ 10/19 | interactiveHeader, hideHeaderOnScroll, backToTop, cookies, multiLangs, doubleTheme, footerNav, footerLegalLinks, footerMadeBy, footerMadeWith |
| **Admin pages (17 штук)** | ✅ Styled | Все через Tailwind, page-header pattern, data-table, grid cards |
| **Admin layout** | ⚠️ Partial | appVerticalNav переключает sidebar/horizontal, но без иконок-тултипов, без мобильного header, без user dropdown |
| **Browser hacks** | ✅ 16 категорий | Все проверены на caniuse: dvh, scrollbars, safe-area, forced-colors, Safari search/date, Hebrew font |
| **RTL** | ✅ HTML-level | dir="%paraglide.textDirection%" |
| **Line-break algo** | ✅ | titleBreaker.ts + brand-colored segments |
| **ScrollSpy + Reveal + Scrollytelling + Parallax** | ✅ | Svelte actions в src/lib/actions/ |
| **GSAP intro** | ⚠️ В src/project/ | Вынесен из framework |
| **FallingLetters** | ⚠️ В src/project/ | Вынесен из framework |
| **Ansible deploy** | ✅ Cleaned | 0 NUXT_* references. Все renamed: NUXT_* → APP_* / PUBLIC_* / DATABASE_URL |
| **Database content** | ❌ Пусто | PM v2 DB тоже 0 bytes |
| **Admin CRUD** | ❌ Read-only | Create/Edit/Delete не реализованы |
| **ConfirmDialog** | ❌ | Нужен для admin действий |
| **ToastContainer** | ❌ | Нужен для уведомлений |
| **ChangePasswordModal** | ❌ | Нужен для admin |
| **Page transitions** | ❌ | 303 строк CSS анимаций в PM v2 |
| **Тесты** | ❌ | Нет ни одного теста |

---

## 2. CSS AUDIT (116 файлов PM v2)

Подробно: `CSS-FULL-AUDIT.md`

| Категория | Файлов | Строк | Готово |
|-----------|--------|-------|--------|
| colors/ | 4 | 376 | ✅ 100% |
| typography/ | 4 | 465 | ✅ 100% |
| common/ | 11 | 920 | ✅ 100% (framework-level) |
| animations/ | 5 | 1040 | ✅ 4/5 (page-transitions — не имплементированы) |
| skeleton/ | 6 | 1695 | ✅ 5/6 (bottom-nav — partial) |
| layout/ (website) | 8 | 1336 | ✅ 100% |
| layout/ (admin) | 3 | 699 | ⚠️ admin-sidebar + admin-header + admin-content partial |
| forms/ | 5 | 1273 | ⚠️ Inputs/search partial |
| content/ | 40 | 7925 | ✅ 27/40 (overlays partial, rest done) |
| admin/ | 1 | 1045 | ⚠️ pages.css partial |
| runtime/ | 16 | 339 | ✅ 16/16 |
| hamburger/ | 1 | 310 | ✅ |
| overlays/ | 3 | 665 | ⚠️ 3/3 partial |
| **TOTAL** | **116** | **18088** | **✅ 70% (81), ⚠️ 15% (17), ❌ НЕ НУЖНО 15% (18)** |

---

## 3. CONFIG PARAMETERS — СТАТУС ВНЕДРЕНИЯ

| Параметр | Значение | Где используется | Статус |
|----------|----------|-----------------|--------|
| headerFooterWidthMode | 'contained'/'full' | TheHeader, TheFooter | ✅ |
| bodyWidthMode | 'contained'/'full' | 13 секций + 5 роутов | ✅ |
| appVerticalNav | true/false | admin +layout.svelte | ⚠️ базовый переключатель |
| verticalNav | true/false | — | ❌ UNUSED (website icon sidebar — not needed) |
| interactiveHeader | true/false | TheHeader | ✅ |
| hideHeaderOnScroll | true/false | TheHeader | ✅ |
| mobileInteractiveHeader | true/false | TheHeader | ✅ |
| doubleTheme | true/false | TheHeader | ✅ |
| multiLangs | true/false | TheHeader | ✅ |
| cookies | true/false | CookieConsent | ✅ |
| backToTop | true/false | BackToTop | ✅ |
| footerNav | true/false | TheFooter | ✅ |
| footerLegalLinks | true/false | TheFooter | ✅ |
| footerMadeBy | true/false | TheFooter | ✅ |
| footerMadeWith | true/false | TheFooter | ✅ |
| footerCta | true/false | TheFooter | ✅ |
| onepager | true/false | SectionRenderer | ✅ |
| scrollytelling | true/false | — | ❌ UNUSED (action exists but not applied in components) |
| heroParallax | true/false | — | ❌ UNUSED |
| pageTransitions | fade/slide/zoom/'' | — | ❌ UNIMPLEMENTED |
| contactEmailConfirmation | true/false | — | ❌ UNUSED |
| contactTelegramNotify | true/false | — | ❌ UNUSED |
| pwa | true/false | — | ❌ UNIMPLEMENTED |

---

## 4. ЧТО ОСТАЛОСЬ (P1-P3)

### P1 — ✅ Done
- ✅ **Mobile admin header** — phone-only with page title + user avatar + menu dropdown
- ✅ **User dropdown menu** — sidebar/horizontal header user avatar → popover with info + logout
- ✅ **ConfirmDialog** — created
- ✅ **ToastContainer** — created

### P2 — Module sub-configs (✅ Done)
- ✅ **team columnsDesktop** → SectionTeam
- ✅ **testimonials layout/autoPlay** → SectionTestimonials
- ✅ **faq expandFirst/allowMultipleOpen** → SectionFaq
- ✅ **features columnsDesktop** → SectionFeatures
- ✅ **clients grayscale/hoverColor** → SectionClients (hardcoded)
- ✅ **onepager/SPA routing** → SectionRenderer check

### P2 — Feature-flag checks (13/22 implemented. 7 remaining below)
- ✅ **footerCta** → TheFooter
- ✅ **mobileInteractiveHeader** → TheHeader
- ✅ **onepager** → SectionRenderer
- ❌ **verticalNav** — website icon sidebar mode (not needed for this project)
- ❌ **scrollytelling** — action exists but not applied in section components
- ❌ **heroParallax** — project-specific (not in scope)
- ❌ **pageTransitions** — 303 lines CSS (P3)
- ❌ **contactEmailConfirmation** — not needed
- ❌ **contactTelegramNotify** — not needed

### P3 — Nice to have
- Bottom nav scrollable rows
- ChangePasswordModal
- Skip-to-content link (WCAG 2.4.1)
- Admin sidebar icon nav with tooltips (partially done in latest rewrite)

---

## 5. KEY ARCHITECTURE DECISIONS

| Решение | Значение |
|---------|----------|
| **CSS** | Tailwind utilities ONLY in components. app.css: @theme + @layer base + @layer utilities (safe-area) + @layer components (hamburger only) + @keyframes |
| **Dark mode** | Class-based (.dark {}), NOT light-dark() |
| **RTL** | dir="%paraglide.textDirection%" in app.html |
| **Icons** | Inline SVG in components |
| **State** | $state() + $derived() only. No global stores except theme/i18n |

---

*Полный CSS-аудит: `CSS-FULL-AUDIT.md` (116 файлов, 18 088 строк)*
*Архитектура стилей: `CSS-ARCHITECTURE.md`*
*Browser-хаки: `CSS-EDGECASES.md`*
