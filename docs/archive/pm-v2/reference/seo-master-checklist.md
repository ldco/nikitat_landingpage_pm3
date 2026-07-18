# SEO Master Checklist For Landing Pages And Sites

This is the PM framework-level checklist for an SEO master reviewing a landing page, website, or app public surface before launch in 2026.

SEO work must make the site easier for users and search engines to understand. It must not rely on tricks, keyword stuffing, mass-generated pages, hidden content, or search-engine-first copy.

## Launch Inputs

Before SEO review starts, collect:

1. Primary business goal.
2. Target audience and region.
3. Primary language and secondary locales.
4. Primary conversion action.
5. Brand/entity name exactly as it should appear in search.
6. Product/service categories.
7. Proof assets: portfolio, reviews, certificates, clients, case studies, team, photos, media mentions.
8. Legal/business facts: company name, address, phone, email, tax/legal data if public.

## Search Intent And Page Strategy

Each indexable page must have one clear job.

For every page define:

| Field | Required |
| --- | --- |
| Search intent | informational, commercial, navigational, transactional, local |
| Primary query cluster | human-readable topic, not a keyword-stuffing list |
| Page promise | what the visitor should understand or do |
| Unique value | what this page says or proves better than generic competitors |
| Conversion path | form, phone, messenger, checkout, booking, download, visit |

Do not create many thin pages for small keyword variations. Use one strong canonical page unless the user intent, location, offer, or language is genuinely different.

## Content Quality

The page must be useful without needing search traffic to justify its existence.

Required:

1. Clear H1 matching the page purpose.
2. Direct opening copy that explains who it is for and what is offered.
3. Specific services/products/results instead of vague claims.
4. Evidence: real work, screenshots, photos, numbers, testimonials, case studies, or process details.
5. Trust signals: company details, team, contacts, policies, legal pages, guarantees where real.
6. No unsupported superlatives such as "best" or "number one" unless backed by evidence.
7. No generic AI filler.

Use AI only as an assistant. Human editorial review, fact checking, and original project/business knowledge are mandatory.

## Metadata

Every indexable page must define:

```html
<title>Specific page title</title>
<meta name="description" content="Specific page summary">
<link rel="canonical" href="https://example.com/page">
```

Rules:

1. Title must be unique, descriptive, and aligned with the visible page content.
2. Meta description must be unique and summarize the page in a way that helps users decide whether to click.
3. Do not use the obsolete `keywords` meta tag as an SEO control.
4. Canonical URL must use the final production protocol, hostname, path, and trailing-slash policy.
5. Localized pages must have correct `hreflang` alternates when the framework supports them.

## Open Graph And Share Metadata

Every important public page must define:

```html
<meta property="og:title" content="Page title">
<meta property="og:description" content="Page summary">
<meta property="og:url" content="https://example.com/page">
<meta property="og:image" content="https://example.com/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
```

Use the designer asset contract in `docs/reference/social-preview-assets.md` for preview images, favicons, and app icons.

## Technical Indexability

Before launch:

1. Production pages return `200` for canonical URLs.
2. Non-canonical variants redirect or canonicalize.
3. Public pages are not blocked by `robots.txt`, auth, broken middleware, or accidental `noindex`.
4. XML sitemap exists and includes canonical public URLs.
5. Robots file points to the sitemap.
6. Important pages are reachable through normal links, not only JavaScript-only UI.
7. Navigation anchor text describes destination pages.
8. Broken links are fixed.
9. 404 pages return real `404`.
10. HTTP to HTTPS redirects correctly.

Run the PM launch asset warning check before release:

```bash
npm run check:launch-assets
```

## Structured Data

Use JSON-LD only when it matches visible page content.

Recommended baseline:

1. `Organization` or `LocalBusiness` on the home/about/contact surface when real business facts are available.
2. `WebSite` for the canonical site identity.
3. `WebPage` or page-specific type for important pages.
4. `Article`, `BlogPosting`, `FAQPage`, `Product`, `Service`, or `BreadcrumbList` only when the visible content genuinely supports it and current Google rich-result policies allow it.

Rules:

1. Do not add fake reviews, fake ratings, fake prices, or unsupported offers.
2. Use stable `@id` values for the organization/site entity.
3. Validate with Google's Rich Results Test when targeting a Google rich result.
4. Structured data can improve eligibility for rich results, but does not guarantee display.

## Images And Media

Required:

1. Important images have descriptive filenames.
2. Informative images have accurate alt text.
3. Decorative images have empty alt text or are hidden from assistive tech.
4. Hero/LCP image is not lazy-loaded.
5. Width/height or aspect-ratio is set to prevent layout shift.
6. Images are compressed and served in appropriate sizes.
7. Videos have captions or transcript where useful.

## Performance And Page Experience

Use field data when available, and lab tools before launch.

Core targets:

| Metric | Good target |
| --- | --- |
| LCP | `<=2.5s` |
| INP | `<=200ms` |
| CLS | `<=0.1` |

Landing-page priorities:

1. Make the first viewport useful quickly.
2. Do not lazy-load the hero image.
3. Preload only critical resources.
4. Keep third-party scripts minimal.
5. Reserve layout space for images, embeds, banners, and forms.
6. Avoid heavy animations that block input.
7. Test on mobile, not only desktop.

## Local And Entity SEO

For local businesses:

1. Name, address, phone, hours, email, and service area must be consistent.
2. Contact page must be crawlable and visible.
3. Add LocalBusiness structured data only when the business has real local presence or local service relevance.
4. Embed maps only when useful; do not let map scripts dominate performance.
5. Link to official profiles when they are maintained.

For non-local brands:

1. Use Organization structured data.
2. Link to official profiles with `sameAs` only when they are real and controlled.
3. Make entity facts consistent across footer, legal pages, contact pages, and structured data.

## AI Search And Answer Surfaces

Do not create separate "AI SEO" pages full of generic answers.

Instead:

1. Make factual claims explicit and easy to quote.
2. Add original details, examples, numbers, process, and evidence.
3. Use clean headings and concise answer sections where useful.
4. Keep entity data consistent.
5. Use structured data honestly.
6. Explain who created/reviewed expert content when trust matters.
7. Disclose automation/AI use when it matters to the reader.

AI-generated content can be used for drafting, structure, or research support, but PM launch content must be accurate, edited, and genuinely useful.

## International SEO

For multilingual sites:

1. Each locale must have human-reviewed copy.
2. Do not auto-translate critical legal, medical, financial, or conversion copy without review.
3. Use correct language in `<html lang>`.
4. Use `hreflang` when multiple locale URLs exist.
5. Keep localized metadata unique.
6. Adapt currency, phone, address, units, and date format to locale.
7. Keep canonical and alternate URLs consistent.

## Analytics And Search Console

Before launch:

1. Configure Google Search Console for the production domain.
2. Submit sitemap after production release.
3. Configure Bing Webmaster Tools when relevant.
4. Verify analytics events for primary conversions.
5. Track form submits, phone clicks, messenger clicks, downloads, and key CTA clicks.
6. Check indexing and coverage after release.
7. Wait a few weeks before judging ranking impact from normal SEO changes.

## Anti-Patterns

Reject launch when any of these are present:

1. Keyword stuffing.
2. Hidden SEO text.
3. Doorway pages.
4. Duplicate landing pages with only city/keyword swaps and no real local value.
5. Fake reviews or fake ratings.
6. Mass AI pages without original value.
7. Metadata that promises content not present on the page.
8. Stock images pretending to be real team/product/project proof.
9. Indexable staging/test pages.
10. Broken mobile layout or blocked conversion path.

## Source References

- Google Search Central: SEO Starter Guide — <https://developers.google.com/search/docs/fundamentals/seo-starter-guide>
- Google Search Central: helpful, reliable, people-first content — <https://developers.google.com/search/docs/fundamentals/creating-helpful-content>
- Google Search Central: AI-generated content guidance — <https://developers.google.com/search/docs/fundamentals/using-gen-ai-content>
- Google Search Central: meta descriptions — <https://developers.google.com/search/docs/appearance/snippet>
- Google Search Central: title links — <https://developers.google.com/search/docs/advanced/appearance/title-link>
- Google Search Central: structured data guidelines — <https://developers.google.com/search/docs/appearance/structured-data/sd-policies>
- Google Search Central: image SEO best practices — <https://developers.google.com/search/docs/advanced/guidelines/google-images>
- Google Search Central: Core Web Vitals and Search — <https://developers.google.com/search/docs/appearance/core-web-vitals>
- web.dev: Web Vitals — <https://web.dev/articles/vitals>
- web.dev: LCP optimization — <https://web.dev/articles/optimize-lcp>
- MDN: favicon glossary — <https://developer.mozilla.org/en-US/docs/Glossary/Favicon>
- MDN: web app manifest icons — <https://developer.mozilla.org/docs/Web/Progressive_web_apps/Manifest/Reference/icons>
- schema.org: LocalBusiness — <https://schema.org/LocalBusiness>
