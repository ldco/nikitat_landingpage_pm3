/**
 * Tracks whether a form snapshot differs from its last clean state.
 *
 * Usage:
 *   const { isDirty, markClean } = useFormDirty(() => ({ ...form }))
 *   // After populating/resetting form:
 *   markClean()
 */
export function useFormDirty<T>(getSnapshot: () => T) {
  const cleanSnapshot = ref('')

  function serialize(): string {
    return JSON.stringify(getSnapshot())
  }

  function markClean(): void {
    cleanSnapshot.value = serialize()
  }

  const isDirty = computed(() => serialize() !== cleanSnapshot.value)

  return {
    isDirty,
    markClean
  }
}
