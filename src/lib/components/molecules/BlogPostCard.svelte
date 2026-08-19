<script lang="ts">
  /**
   * BlogPostCard — Blog post excerpt (PM v2 tokens)
   *
   * Composes the canonical Card primitive (atoms/Card.svelte) for the shell —
   * elevated bg, border, radius, hover shadow — and owns the blog-specific
   * body contract (cover, category, title link, excerpt, author/date meta).
   * The `group` shell class is supplied here so the image zoom and title color
   * respond to card hover; the body grows (`flex-1`) to pin the meta row to
   * the bottom of equal-height grid cards.
   *
   * Rule #1: class prop + twMerge
   *
   * @props {string} slug — post slug for the link
   * @props {string} title — post title
   * @props {string} [excerpt=''] — short excerpt text
   * @props {string} [coverImageUrl] — cover image source
   * @props {string} [coverImageAlt] — cover image alt text (falls back to title)
   * @props {string} [publishedAt] — date for the meta row (ISO string or Date)
   * @props {number} [readingTimeMinutes] — reading time for the min-read label
   * @props {string} [category=''] — category label
   * @props {string} [authorName=''] — author display name
   * @props {string} [class] — additional CSS classes merged via twMerge
   *
   * @example
   * <BlogPostCard slug={post.slug} title={post.title} excerpt={post.excerpt} />
   */
  import { twMerge } from 'tailwind-merge'
  import AppImage from '$lib/components/atoms/AppImage.svelte'
  import Card from '$lib/components/atoms/Card.svelte'
  import { localizedHref } from '$lib/utils/navigation'
  import { currentLocale } from '$lib/stores/locale.svelte'
  import { t } from '$lib/stores/content.svelte'

  let {
    slug,
    title,
    excerpt = '',
    coverImageUrl = '',
    coverImageAlt = '',
    publishedAt,
    readingTimeMinutes,
    category = '',
    authorName = '',
    class: className = ''
  }: {
    slug: string
    title: string
    excerpt?: string
    coverImageUrl?: string | null
    coverImageAlt?: string | null
    publishedAt?: string | Date | null
    readingTimeMinutes?: number | null
    category?: string
    authorName?: string
    class?: string
  } = $props()
</script>

<Card
  hover
  padding="none"
  class={twMerge('group flex flex-col hover:translate-y-0', className)}
  classBody="flex flex-col flex-1 p-5"
>
  {#snippet image()}
    {#if coverImageUrl}
      <div class="aspect-video overflow-hidden">
        <AppImage src={coverImageUrl} alt={coverImageAlt || title} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      </div>
    {/if}
  {/snippet}

  {#if category}
    <span class="text-xs font-medium uppercase tracking-wider text-pm-brand mb-2">{category}</span>
  {/if}

  {#if readingTimeMinutes}
    <span class="text-xs text-pm-text-muted mb-2">{t('blog.minRead', { minutes: String(readingTimeMinutes) })}</span>
  {/if}

  <h3 class="text-lg font-bold text-pm-text group-hover:text-pm-brand transition-colors">
    <a href={localizedHref(`/blog/${slug}`, currentLocale())}>{title}</a>
  </h3>

  {#if excerpt}
    <p class="mt-2 text-sm text-pm-text-muted line-clamp-3">{excerpt}</p>
  {/if}

  <div class="flex items-center gap-3 mt-auto pt-4 text-xs text-pm-text-muted">
    {#if authorName}
      <span>{authorName}</span>
    {/if}
    {#if publishedAt}
      <time datetime={new Date(publishedAt).toISOString()}>{new Date(publishedAt).toLocaleDateString()}</time>
    {/if}
  </div>
</Card>
