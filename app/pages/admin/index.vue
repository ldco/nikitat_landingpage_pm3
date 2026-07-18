<script setup lang="ts">
/**
 * Admin Index - Redirects to first available page
 *
 * Dynamically redirects to the first section the user has access to,
 * based on their role and enabled modules.
 */
import { getPmAdminSectionsForRole } from '~~/pm-core/app/composables/usePmConfig'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  pageTransition: false
})

const { user } = useAuth()
const localePath = useLocalePath()

// SSR-safe config access with defensive defaults
// Get first available section for user's role and redirect
watchEffect(() => {
  if (user.value?.role) {
    const sections = getPmAdminSectionsForRole(user.value.role)
    const firstSection = sections[0]
    if (firstSection) {
      navigateTo(localePath(`/admin/${firstSection.id}`), { replace: true })
    }
  }
})
</script>

<template>
  <div></div>
</template>
