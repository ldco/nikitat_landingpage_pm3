<script setup lang="ts">
import '~/assets/css/ui/content/casestudy.css'
import type { CaseStudyPortfolioItem } from '~~/pm-core/app/types'

const props = defineProps<{
  item: CaseStudyPortfolioItem
}>()

const tags = computed<string[]>(() => {
  if (!props.item.tags) return []
  if (Array.isArray(props.item.tags)) return props.item.tags
  try {
    return JSON.parse(props.item.tags)
  } catch {
    return []
  }
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
  <div class="casestudy-viewer">
    <div class="casestudy-viewer-header">
      <span v-if="item.category" class="portfolio-card-category">{{ item.category }}</span>
      <h2 class="casestudy-viewer-title">{{ item.title }}</h2>
    </div>

    <div v-if="item.content" class="casestudy-viewer-body">
      <template v-for="block in parseContent(item.content)" :key="block.id">
        <h3 v-if="block.type === 'heading'" class="casestudy-viewer-heading">
          {{ block.text }}
        </h3>
        <p v-else class="casestudy-viewer-text">
          {{ block.text }}
        </p>
      </template>
    </div>

    <p v-else-if="item.description && !item.content" class="casestudy-viewer-text">
      {{ item.description }}
    </p>

    <div v-if="tags.length" class="casestudy-viewer-tags">
      <span
        v-for="tag in tags"
        :key="tag"
        class="casestudy-viewer-tag"
      >
        {{ tag }}
      </span>
    </div>
  </div>
</template>
