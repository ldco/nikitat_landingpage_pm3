<script setup lang="ts">
/**
 * CTA Button Atom
 *
 * Call-to-action button with multiple variants.
 * Handles routes, anchors, and external links appropriately.
 */

const props = defineProps<{
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  /** Button size */
  size?: 'sm' | 'md' | 'lg'
  /** Link destination (route or anchor) */
  to?: string
  /** External href (makes it an <a> with target="_blank") */
  href?: string
  /** Disabled state */
  disabled?: boolean
  /** Full width */
  fullWidth?: boolean
  /** Button type (for form submission) */
  type?: 'button' | 'submit' | 'reset'
}>()

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const { resolveWebsiteHref } = useWebsiteNavigation()

const btnClasses = computed(() => [
  'btn',
  `btn-${props.variant ?? 'primary'}`,
  (props.variant ?? 'primary') === 'primary' ? 'action-surface action-surface--brand' : '',
  props.size ? `btn-${props.size}` : '',
  { 'btn-full': props.fullWidth }
])

const resolvedTo = computed(() => resolveWebsiteHref(props.to))
const isAnchor = computed(() => resolvedTo.value.startsWith('#'))
</script>

<template>
  <!--
    Uses global classes from ui/forms/buttons.css:
    .btn, .btn-primary, .btn-secondary, .btn-outline, .btn-ghost
    .btn-sm, .btn-lg, .btn-full
  -->

  <!-- Anchor link: use plain <a> to avoid Vue Router warnings -->
  <a v-if="resolvedTo && isAnchor" :href="resolvedTo" :class="btnClasses" @click="emit('click', $event)">
    <span class="btn__label">
      <slot />
    </span>
  </a>

  <!-- Internal route: use NuxtLink -->
  <NuxtLink v-else-if="resolvedTo" :to="resolvedTo" :class="btnClasses" @click="emit('click', $event)">
    <span class="btn__label">
      <slot />
    </span>
  </NuxtLink>

  <!-- External link: use <a> with target="_blank" -->
  <a
    v-else-if="href"
    :href="href"
    :class="btnClasses"
    target="_blank"
    rel="noopener noreferrer"
    @click="emit('click', $event)"
  >
    <span class="btn__label">
      <slot />
    </span>
  </a>

  <!-- Button -->
  <button
    v-else
    :type="type ?? 'button'"
    :disabled="disabled"
    :class="btnClasses"
    @click="emit('click', $event)"
  >
    <span class="btn__label">
      <slot />
    </span>
  </button>
</template>

<!-- No scoped styles needed - all styles come from ui/forms/buttons.css -->
