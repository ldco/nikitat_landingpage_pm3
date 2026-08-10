<script lang="ts">
  /**
   * Seo — shared metadata layer for public routes (title + description + OG).
   *
   * The ONE contract every public page uses instead of hand-building partial
   * `<title>` tags from the raw SEO config key. Text is resolved by
   * `$lib/utils/seo` from publicSettings (admin-managed seo.* rows) with a
   * translated i18n fallback — never the raw key string.
   *
   * @props {string} [title] — page-specific title segment (optional; homepage
   *   renders just the site name). Composed as `<title> — <site name>`.
   * @props {string} [description] — page-specific meta description; falls back
   *   to the site-wide description.
   * @props {boolean} [noindex] — emit <meta name="robots" content="noindex">.
   * @example <Seo />                        → homepage defaults
   * @example <Seo title={t('nav.blog')} />  → subpage title
   */
  import { resolvePageTitle, resolveSiteDescription } from '$lib/utils/seo'

  let {
    title = '',
    description = '',
    noindex = false
  }: {
    title?: string
    description?: string
    noindex?: boolean
  } = $props()

  const fullTitle = $derived(resolvePageTitle(title || undefined))
  const resolvedDescription = $derived(description || resolveSiteDescription())
</script>

<svelte:head>
  <title>{fullTitle}</title>
  <meta name="description" content={resolvedDescription} />
  <meta property="og:title" content={fullTitle} />
  <meta property="og:description" content={resolvedDescription} />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="/og-image.png" />
  {#if noindex}
    <meta name="robots" content="noindex" />
  {/if}
</svelte:head>
