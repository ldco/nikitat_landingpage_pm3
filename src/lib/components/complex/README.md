# complex/

Page regions composing molecules + atoms: TheHeader, TheFooter, Onepager,
SectionRenderer, CookieConsent, ConfirmDialog, ToastContainer. May hold state.

**Rules:** config-driven via FEATURES/MODULES from `$lib/config/site`. Never
fetch internal APIs. JSDoc required.

**Key pieces:** `Onepager` (section orchestration), `SectionRenderer` (registry dispatch).
