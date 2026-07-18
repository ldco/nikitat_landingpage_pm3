<script setup lang="ts">
import '~/assets/css/ui/content/portfolio-branding.css'
import type { CaseStudyPortfolioItem } from '~~/pm-core/app/types'
import { parseMetadata } from '~~/pm-core/app/portfolios/registry'
import { brandingMetadataSchema } from '~~/pm-core/app/portfolios/registry'
import type { BrandingMetadata } from '~~/pm-core/app/portfolios/registry'
import IconWorld from '~icons/tabler/world'

const { t } = useI18n()

const props = defineProps<{
  item: CaseStudyPortfolioItem
}>()

const metadata = parseMetadata<BrandingMetadata>(props.item.metadata, brandingMetadataSchema)

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

const sectionKeyMap: Record<string, string> = {
  'задача': 'task', 'концепция': 'concept', 'результат': 'result',
  'итог': 'summary', 'решение': 'solution', 'реализация': 'implementation',
  'айдентика': 'identity', 'логотип': 'logo', 'типографика': 'typography',
  'типографика-и-цвет': 'typography-color',
  'цветовая-палитра': 'color-palette', 'цветовая-гамма': 'color-scheme',
  'цветовая-стратегия': 'color-strategy', 'палитра': 'palette',
  'колористика': 'coloristics', 'дизайн-решения': 'design-solutions',
  'визуальные-решения': 'visual-solutions', 'визуальный-код': 'visual-code',
  'концепция-и-нейминг': 'concept-naming', 'позиционирование': 'positioning',
  'стратегия': 'strategy', 'стилистика': 'stylistics',
  'описание-проекта': 'project-description', 'описание-работы': 'work-description',
  'о-проекте': 'about-project', 'ключевые-элементы': 'key-elements',
  'ключевые-элементы-дизайна': 'key-design-elements',
  'анализ-дизайна': 'design-analysis', 'визуальная-система': 'visual-system',
  'графика-и-носители': 'graphics-media', 'носители-стиля': 'brand-carriers',
  'носители': 'carriers', 'материалы-и-носители': 'materials-carriers',
  'адаптивность': 'adaptability', 'применение-айдентика': 'identity-application',
  'эмоциональный-ui': 'emotional-ui', 'ux-сценарии': 'ux-scenarios',
  'слоган': 'slogan', 'посыл': 'message', 'шрифтовая-система': 'font-system',
  'цель': 'goal',
}

function translateHeading(heading: string): string {
  const key = heading.toLowerCase().replace(/[\s-]+/g, '-').replace(/[^a-zа-яё0-9-]/g, '')
  const mapped = sectionKeyMap[key]
  if (mapped) {
    const result = t(`portfolio.section.${mapped}`)
    if (result && result !== `portfolio.section.${mapped}`) return result
  }
  return heading
}
</script>

<template>
  <div class="branding-viewer">
    <div class="branding-viewer-header">
      <span v-if="item.category" class="portfolio-card-category">{{ item.category }}</span>
      <h2 class="branding-viewer-title">{{ item.title }}</h2>
      <a
        v-if="metadata.clientUrl"
        :href="metadata.clientUrl.startsWith('http') ? metadata.clientUrl : 'https://' + metadata.clientUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="branding-viewer-link"
      >
        <IconWorld />
        <span>{{ metadata.clientUrl }}</span>
      </a>
    </div>

    <div v-if="item.content" class="branding-viewer-content">
      <template v-for="block in parseContent(item.content)" :key="block.id">
        <h3 v-if="block.type === 'heading'" class="branding-viewer-section-heading">
          {{ block.text }}
        </h3>
        <p v-else-if="block.type === 'text'" class="branding-viewer-text">
          {{ block.text }}
        </p>
      </template>
    </div>

    <div v-else class="branding-viewer-sections">
      <article
        v-for="(section, idx) in metadata.sections"
        :key="idx"
        class="branding-viewer-section"
      >
        <h3 v-if="section.heading" class="branding-viewer-section-heading">
          {{ translateHeading(section.heading) }}
        </h3>
        <div class="branding-viewer-section-content">
          <p v-for="(par, pi) in section.content" :key="pi">{{ par }}</p>
        </div>
      </article>
    </div>

    <div v-if="item.description && !item.content && !metadata.sections.length" class="branding-viewer-prose">
      <p>{{ item.description }}</p>
    </div>

    <div v-if="metadata.tags && metadata.tags.length" class="branding-viewer-tags">
      <span
        v-for="tag in metadata.tags"
        :key="tag"
        class="branding-viewer-tag"
      >
        {{ tag }}
      </span>
    </div>
  </div>
</template>
