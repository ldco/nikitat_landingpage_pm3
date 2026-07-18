<script setup lang="ts">
import '~/assets/css/ui/content/website-viewer.css'
import type { CaseStudyPortfolioItem } from '~~/pm-core/app/types'
import { parseMetadata, websiteMetadataSchema } from '~~/pm-core/app/portfolios/registry'
import type { WebsiteMetadata } from '~~/pm-core/app/portfolios/registry'
import IconWorld from '~icons/tabler/world'

const props = defineProps<{
  item: CaseStudyPortfolioItem
}>()

const metadata = parseMetadata<WebsiteMetadata>(props.item.metadata, websiteMetadataSchema)

const tags = computed<string[]>(() => {
  if (!props.item.tags) return []
  if (Array.isArray(props.item.tags)) return props.item.tags
  try { return JSON.parse(props.item.tags) } catch { return [] }
})

function parseContent(content: string): Array<{ id: number; type: 'heading' | 'text'; text: string }> {
  const blocks: Array<{ id: number; type: 'heading' | 'text'; text: string }> = []
  let id = 0
  for (const raw of content.split('\n')) {
    const trimmed = raw.trim()
    if (!trimmed) continue
    const headingMatch = trimmed.match(/^###\s+(.+)/)
    if (headingMatch) {
      blocks.push({ id: id++, type: 'heading', text: headingMatch[1] })
    } else {
      blocks.push({ id: id++, type: 'text', text: trimmed })
    }
  }
  return blocks
}
</script>

<template>
  <div class="website-viewer">
    <div class="website-viewer-header">
      <span v-if="item.category" class="portfolio-card-category">{{ item.category }}</span>
      <h2 class="website-viewer-title">{{ item.title }}</h2>
      <a
        v-if="metadata.liveUrl"
        :href="metadata.liveUrl.startsWith('http') ? metadata.liveUrl : 'https://' + metadata.liveUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="website-viewer-link"
      >
        <IconWorld />
        <span>{{ metadata.liveUrl }}</span>
      </a>
    </div>

    <div v-if="item.content" class="website-viewer-body">
      <template v-for="block in parseContent(item.content)" :key="block.id">
        <h3 v-if="block.type === 'heading'" class="website-viewer-heading">{{ block.text }}</h3>
        <p v-else class="website-viewer-text">{{ block.text }}</p>
      </template>
    </div>

    <p v-else-if="item.description" class="website-viewer-text">
      {{ item.description }}
    </p>

    <div v-if="metadata.technologies && metadata.technologies.length" class="website-viewer-section">
      <h3 class="website-viewer-heading">{{ $t('portfolio.technologies') }}</h3>
      <div class="website-viewer-tags">
        <span v-for="tech in metadata.technologies" :key="tech" class="website-viewer-tag">
          {{ tech }}
        </span>
      </div>
    </div>

    <div v-if="tags.length" class="website-viewer-section">
      <div class="website-viewer-tags">
        <span v-for="tag in tags" :key="tag" class="website-viewer-tag">
          {{ tag }}
        </span>
      </div>
    </div>
  </div>
</template>
