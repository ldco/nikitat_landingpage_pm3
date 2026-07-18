<script setup lang="ts">
import IconArrowLeft from '~icons/tabler/arrow-left'
import IconArrowRight from '~icons/tabler/arrow-right'
import { getResponsiveImagePaths } from '~/utils/image-assets'

const props = withDefaults(defineProps<{
  beforeSrc: string
  afterSrc: string
  initial?: number
  width?: number
  height?: number
}>(), {
  initial: 100,
  width: 800,
  height: 800
})

const containerRef = ref<HTMLElement | null>(null)
const position = ref(props.initial)
let dragging = false

function clamp(v: number) { return Math.max(0, Math.min(100, v)) }

function onPointerDown(e: PointerEvent) {
  dragging = true
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  update(e)
}

function onPointerMove(e: PointerEvent) {
  if (!dragging) return
  update(e)
}

function onPointerUp() {
  dragging = false
}

function update(e: PointerEvent) {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  position.value = clamp(((e.clientX - rect.left) / rect.width) * 100)
}

function srcToImagePath(src: string): string {
  return src.replace(/^\//, '').replace(/^images\//, '').replace(/\.(png|jpg|jpeg|gif|webp|avif)$/i, '')
}

function getImageSources(src: string) {
  return getResponsiveImagePaths(srcToImagePath(src))
}
</script>

<template>
  <div
    ref="containerRef"
    class="ba-slider"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointerleave="onPointerUp"
  >
    <picture v-if="afterSrc">
      <source :srcset="getImageSources(afterSrc).avif" type="image/avif" />
      <source :srcset="getImageSources(afterSrc).webp" type="image/webp" />
      <img :src="afterSrc" alt="" class="ba-slider__img ba-slider__after" :width="width" :height="height" />
    </picture>

    <div
      class="ba-slider__before-clip"
      :style="{ clipPath: `inset(0 ${100 - position}% 0 0)` }"
    >
      <div class="ba-slider__before-bg"></div>
      <picture v-if="beforeSrc">
        <source :srcset="getImageSources(beforeSrc).avif" type="image/avif" />
        <source :srcset="getImageSources(beforeSrc).webp" type="image/webp" />
        <img :src="beforeSrc" alt="" class="ba-slider__img ba-slider__before" :width="width" :height="height" />
      </picture>
    </div>

    <div class="ba-slider__handle" :style="{ left: position + '%' }">
      <div class="ba-slider__line"></div>
      <div class="ba-slider__grip">
        <IconArrowLeft class="ba-slider__arrow" />
        <IconArrowRight class="ba-slider__arrow" />
      </div>
    </div>
  </div>
</template>
