/**
 * useClientMounted - Track component mount state on the client
 *
 * Prevents SSR hydration mismatches by deferring client-only state
 * until the component is mounted on the client.
 *
 * @example
 * ```vue
 * <script setup>
 * const { isMounted } = useClientMounted()
 * </script>
 *
 * <template>
 *   <div :class="{ 'active': isMounted && isActive }">
 *     <!-- No hydration mismatch: active class applied after mount -->
 *   </div>
 * </template>
 * ```
 *
 * @see https://nuxt.com/docs/guide/going-further/experimental-features#inlinetemplate
 */

export function useClientMounted() {
  const isMounted = ref(false)

  onMounted(() => {
    isMounted.value = true
  })

  return {
    isMounted
  }
}
