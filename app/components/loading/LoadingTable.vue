<script setup lang="ts">
/**
 * Table Loading Placeholder Component
 *
 * Displays a table placeholder with header and rows.
 */
withDefaults(
  defineProps<{
    rows?: number
    columns?: number
    showHeader?: boolean
  }>(),
  {
    rows: 5,
    columns: 4,
    showHeader: true
  }
)

function headerWidth(column: number): string {
  return `${82 + column % 4 * 4}%`
}

function cellWidth(row: number, column: number): string {
  return `${62 + (row * 13 + column * 7) % 34}%`
}
</script>

<template>
  <div class="placeholder-table">
    <!-- Header row -->
    <div v-if="showHeader" class="placeholder-table__header">
      <LoadingBase
        v-for="col in columns"
        :key="`header-${col}`"
        height="1.25em"
        :width="headerWidth(col)"
      />
    </div>
    <!-- Data rows -->
    <div v-for="row in rows" :key="`row-${row}`" class="placeholder-table__row">
      <LoadingBase
        v-for="col in columns"
        :key="`cell-${row}-${col}`"
        height="1em"
        :width="cellWidth(row, col)"
      />
    </div>
  </div>
</template>
