<script setup lang="ts">
import type { CaseStudyPortfolioItem } from '~~/pm-core/app/types'

const props = defineProps<{
  item: CaseStudyPortfolioItem
}>()
</script>

<template>
  <div class="brandbook-viewer">
    <div class="brandbook-viewer-placeholder">
      <h2>{{ item.title }}</h2>
      <p>Brandbook viewer — coming soon</p>
    </div>
  </div>
</template>
