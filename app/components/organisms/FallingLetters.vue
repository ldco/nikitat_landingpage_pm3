<script setup lang="ts">
/**
 * OrganismsFallingLetters
 *
 * Dense canvas overlay: on load, letters rain down rapidly from the ceiling
 * filling the entire background. On scroll, all letters spin together
 * like gears in one unified mechanism.
 *
 * Respects prefers-reduced-motion (hides completely).
 */
const canvasRef = ref<HTMLCanvasElement | null>(null)
useFallingLetters({ canvasRef })
</script>

<template>
  <canvas ref="canvasRef" class="falling-letters" aria-hidden="true" />
</template>
