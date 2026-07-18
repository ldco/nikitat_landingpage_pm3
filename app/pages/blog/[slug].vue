<script setup lang="ts">
import IconArrowLeft from '~icons/tabler/arrow-left'
import IconClock from '~icons/tabler/clock'
import '~/assets/css/runtime/section-blog.css'
import { sanitizeHtml } from '~/utils/sanitize'

interface BlogPostDetail {
  id: number
  slug: string
  title: string
  excerpt: string | null
  content: string | null
  coverImageUrl: string | null
  coverImageAlt: string | null
  publishedAt: string | null
  readingTimeMinutes: number | null
  category: { slug: string; name: string } | null
  tags: Array<{ slug: string; name: string }>
  author: { name: string } | null
}

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const localePath = useLocalePath()
const { t, locale } = useI18n()

const slug = computed(() => {
  const value = route.params.slug
  return Array.isArray(value) ? value[0] : value
})

const { data: post, pending, error } = await useAsyncData(
  () => `blog-post-${slug.value}-${locale.value}`,
  () => apiFetch<BlogPostDetail>(`/api/blog/${encodeURIComponent(slug.value || '')}`, {
    query: { locale: locale.value }
  }),
  { watch: [slug, locale] }
)

function formatDate(date: string | null): string {
  if (!date) return ''

  return new Date(date).toLocaleDateString(locale.value, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  })
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const renderedContent = computed(() => {
  const content = post.value?.content?.trim()

  if (!content) {
    return ''
  }

  if (/<[a-z][\s\S]*>/i.test(content)) {
    return sanitizeHtml(content)
  }

  return content
    .split(/\n{2,}/)
    .map(paragraph => `<p>${escapeHtml(paragraph.trim()).replace(/\n/g, '<br />')}</p>`)
    .join('')
})

useSeoMeta({
  title: () => post.value?.title ?? t('blog.title'),
  description: () => post.value?.excerpt ?? '',
  ogTitle: () => post.value?.title ?? t('blog.title'),
  ogDescription: () => post.value?.excerpt ?? '',
  ogType: 'article',
  ogImage: () => post.value?.coverImageUrl ?? undefined,
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <main class="section blog-post-page">
    <div class="container container--narrow">
      <NuxtLink :to="localePath('/blog')" class="blog-post-page__back">
        <IconArrowLeft />
        <span>{{ t('nav.blog') }}</span>
      </NuxtLink>

      <div v-if="pending" class="blog-grid__loading">
        {{ t('common.loading') }}
      </div>

      <div v-else-if="error || !post" class="blog-grid__empty">
        {{ t('common.pageNotFound') }}
      </div>

      <article v-else class="blog-post-page__article">
        <header class="blog-post-page__header">
          <p v-if="post.category" class="blog-post-page__category">{{ post.category.name }}</p>
          <h1 class="blog-post-page__title">{{ post.title }}</h1>
          <p v-if="post.excerpt" class="blog-post-page__excerpt">{{ post.excerpt }}</p>
          <div class="blog-post-page__meta">
            <span v-if="post.publishedAt">{{ formatDate(post.publishedAt) }}</span>
            <span v-if="post.readingTimeMinutes" class="blog-post-page__reading-time">
              <IconClock />
              {{ post.readingTimeMinutes }} {{ t('blog.minRead') }}
            </span>
            <span v-if="post.author">{{ post.author.name }}</span>
          </div>
        </header>

        <img
          v-if="post.coverImageUrl"
          :src="post.coverImageUrl"
          :alt="post.coverImageAlt || post.title"
          class="blog-post-page__cover"
        />

        <div v-if="renderedContent" class="blog-post-page__content" v-html="renderedContent" />

        <div v-if="post.tags.length" class="blog-post-page__tags">
          <span v-for="tag in post.tags" :key="tag.slug" class="blog-post-page__tag">
            {{ tag.name }}
          </span>
        </div>
      </article>
    </div>
  </main>
</template>
