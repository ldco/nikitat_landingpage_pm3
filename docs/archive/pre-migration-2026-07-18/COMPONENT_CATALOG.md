# Component Catalog: Port to Svelte

**Note:** Files are in source directory `app/components/`. All need porting to Svelte 5 + Tailwind.

---

## A. UI Components (replacing atoms + molecules + organisms)

| # | Source (Vue) | Target (Svelte) | Props/State | Notes |
|---|-------------|-----------------|-------------|-------|
| 1 | `atoms/AppImage.vue` | `ui/AppImage.svelte` | src, alt, fallback, loading | Smart image with error state |
| 2 | `atoms/BackToTop.vue` | `ui/BackToTop.svelte` | — | Fixed button, shows on scroll > 500px |
| 3 | `atoms/CtaButton.vue` | `ui/CtaButton.svelte` | to, variant, size, disabled | variants: primary, outline, ghost; sizes: sm, md, lg |
| 4 | `atoms/HamburgerIcon.vue` | `ui/HamburgerIcon.svelte` | isOpen, label, onToggle | CSS-only animation |
| 5 | `atoms/LangSwitcher.vue` | `ui/LangSwitcher.svelte` | — | Dropdown with flags per locale |
| 6 | `atoms/Logo.vue` | `ui/Logo.svelte` | — | Auto light/dark + locale (from config) |
| 7 | `atoms/MadeBy.vue` | `ui/MadeBy.svelte` | — | Footer attribution link |
| 8 | `atoms/MadeWith.vue` | `ui/MadeWith.svelte` | — | "Made with PM" badge |
| 9 | `atoms/NavLink.vue` | `ui/NavLink.svelte` | href, label, active | Handles anchors (#) vs routes (/) |
| 10 | `atoms/PictureImage.vue` | `ui/PictureImage.svelte` | src, alt, widths | AVIF/WebP picture element |
| 11 | `atoms/SocialIcon.vue` | `ui/SocialIcon.svelte` | platform, url | Brand-aware icon (telegram, github, etc.) |
| 12 | `atoms/ThemeToggle.vue` | `ui/ThemeToggle.svelte` | — | Light/dark/system cycle |
| 13 | `atoms/EmptyState.vue` | `ui/EmptyState.svelte` | message, icon | Used in admin lists |
| 14 | `molecules/BeforeAfterSlider.vue` | `ui/BeforeAfterSlider.svelte` | beforeSrc, afterSrc, width, height | Image comparison |
| 15 | `molecules/BlogPostCard.vue` | `ui/BlogPostCard.svelte` | post | Blog excerpt card |
| 16 | `molecules/ContactInfo.vue` | `ui/ContactInfo.svelte` | showMap | Email/phone/location from settings |
| 17 | `molecules/FooterCta.vue` | `ui/FooterCta.svelte` | — | CTA button in footer |
| 18 | `molecules/FooterNav.vue` | `ui/FooterNav.svelte` | — | Nav links in footer |
| 19 | `molecules/HeaderActions.vue` | `ui/HeaderActions.svelte` | showContact, langDirection | Lang + theme + contact buttons |
| 20 | `molecules/HeaderContact.vue` | `ui/HeaderContact.svelte` | mode | Quick contact: 'contacts' or 'cta' |
| 21 | `molecules/HeroParallaxScene.vue` | `ui/HeroParallaxScene.svelte` | — | Parallax layers (disabled in config) |
| 22 | `molecules/LegalInfo.vue` | `ui/LegalInfo.svelte` | — | INN/OGRN/address bar |
| 23 | `molecules/NavLinks.vue` | `ui/NavLinks.svelte` | vertical, onNavigate | Section nav list |
| 24 | `molecules/PortfolioLightbox.vue` | `ui/Lightbox.svelte` | images, currentIndex, onClose | Gallery lightbox |
| 25 | `molecules/PricingCard.vue` | `ui/PricingCard.svelte` | tier, period | Pricing plan card |
| 26 | `molecules/SocialNav.vue` | `ui/SocialNav.svelte` | circle | Social media icon row |
| 27 | `molecules/TeamMemberCard.vue` | `ui/TeamMemberCard.svelte` | member | Team profile (disabled) |
| 28 | `organisms/BlogPostsGrid.vue` | `ui/BlogPostsGrid.svelte` | posts | Grid with pagination |
| 29 | `organisms/ChangePasswordModal.vue` | `ui/ChangePasswordModal.svelte` | — | Modal dialog |
| 30 | `organisms/ConfirmDialog.vue` | `ui/ConfirmDialog.svelte` | title, message, onConfirm | Generic confirm |
| 31 | `organisms/CookieConsent.vue` | `ui/CookieConsent.svelte` | — | GDPR/152-ФЗ banner |
| 32 | `organisms/FallingLetters.vue` | `ui/FallingLetters.svelte` | — | Three.js canvas (fixed, ambient) |
| 33 | `organisms/OnepagerThreeStoryScene.vue` | `ui/ScrollyScene.svelte` | — | 3D scrollytelling scene |
| 34 | `organisms/PricingComparison.vue` | `ui/PricingComparison.svelte` | tiers | Feature comparison table |
| 35 | `organisms/PricingTiers.vue` | `ui/PricingTiers.svelte` | tiers | Card group |
| 36 | `organisms/SectionRenderer.vue` | `ui/SectionRenderer.svelte` | sectionId | Dynamic section loader |
| 37 | `organisms/TeamGrid.vue` | `ui/TeamGrid.svelte` | members | Team grid (disabled) |
| 38 | `organisms/TheFooter.vue` | `ui/Footer.svelte` | rich | Complete footer |
| 39 | `organisms/TheHeader.vue` | `ui/Header.svelte` | — | Complete header |
| 40 | `organisms/ToastContainer.vue` | `ui/ToastContainer.svelte` | toasts | Notification toasts |
| 41 | `atoms/SocialIcon.vue` | `ui/SocialIcon.svelte` | — | Social brand icon |
| 42 | — | `ui/Avatar.svelte` | src, name | User avatar |
| 43 | — | `ui/Badge.svelte` | text, variant | Status badge |
| 44 | — | `ui/Spinner.svelte` | size | Loading spinner |
| 45 | — | `ui/Skeleton.svelte` | width, height | Skeleton loader |

---

## B. Section Components

| # | Source (Vue) | Target (Svelte) | Key features |
|---|-------------|-----------------|--------------|
| 1 | `sections/SectionHero.vue` | `sections/SectionHero.svelte` | GSAP intro, word-split, CTAs |
| 2 | `sections/SectionAbout.vue` | `sections/SectionAbout.svelte` | BeforeAfterSlider, 2-column |
| 3 | `sections/SectionFocus.vue` | `sections/SectionFocus.svelte` | 6-card grid with icons |
| 4 | `sections/SectionF22.vue` | `sections/SectionF22.svelte` | HTML description, made-by logos |
| 5 | `sections/SectionContact.vue` | `sections/SectionContact.svelte` | Form + legal consent + contact info |
| 6 | `sections/SectionPortfolio.vue` | `sections/SectionPortfolio.svelte` | Filtered grid, links to detail |
| 7 | `sections/SectionBlog.vue` | `sections/SectionBlog.svelte` | Blog post cards |
| 8 | `sections/SectionFeatures.vue` | `sections/SectionFeatures.svelte` | Icon-top cards |
| 9 | `sections/SectionFaq.vue` | `sections/SectionFaq.svelte` | Accordion with expand |
| 10 | `sections/SectionPricing.vue` | `sections/SectionPricing.svelte` | Tier cards + toggle |
| 11 | `sections/SectionTeam.vue` | `sections/SectionTeam.svelte` | Member cards (disabled) |
| 12 | `sections/SectionTestimonials.vue` | `sections/SectionTestimonials.svelte` | Carousel (disabled) |
| 13 | `sections/SectionClients.vue` | `sections/SectionClients.svelte` | Logo strip (disabled) |

---

## C. Portfolio Viewers

| # | Source (Vue) | Target (Svelte) | Portfolio type |
|---|-------------|-----------------|----------------|
| 1 | `portfolios/BrandbookViewer.vue` | `portfolios/BrandbookViewer.svelte` | brandbook — multi-page PDF/images |
| 2 | `portfolios/BrandingViewer.vue` | `portfolios/BrandingViewer.svelte` | branding — sections + mockups |
| 3 | `portfolios/CaseStudyViewer.vue` | `portfolios/CaseStudyViewer.svelte` | case_study — rich content |
| 4 | `portfolios/WebsiteViewer.vue` | `portfolios/WebsiteViewer.svelte` | website — screenshots + URL |

---

## D. Admin Components (new)

| # | Target (Svelte) | Purpose |
|---|-----------------|---------|
| 1 | `admin/AdminSidebar.svelte` | Navigation sidebar with role-filtered sections |
| 2 | `admin/AdminHeader.svelte` | Top bar with user menu + notifications |
| 3 | `admin/DataTable.svelte` | Sortable, filterable, paginated table |
| 4 | `admin/FormField.svelte` | Label + input + error display |
| 5 | `admin/ImageUpload.svelte` | Drag-drop image upload with preview |
| 6 | `admin/DashboardCard.svelte` | Stat card for dashboard |
| 7 | `admin/ActivityFeed.svelte` | Recent activity list |
| 8 | `admin/TwoFactorSetup.svelte` | QR + verify flow |
| 9 | `admin/TwoFactorVerify.svelte` | Code entry during login |
| 10 | `admin/JsonEditor.svelte` | JSON field editor |
| 11 | `admin/ColorPicker.svelte` | Color input |
