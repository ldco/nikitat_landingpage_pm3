<script setup lang="ts">
/**
 * HeaderActions Molecule
 *
 * Header action buttons grouped together:
 * - Quick contact buttons (phone + messenger) - optional via prop
 * - Theme toggle (if doubleTheme enabled)
 * - Language switcher (if multiLangs enabled)
 * - Login button (only in website-app mode)
 *
 * Shows only enabled features based on config.
 */
import IconLogin from '~icons/tabler/login'
import { parseHeaderQuickContactItems } from '~/composables/useHeaderQuickContacts'
import { usePmConfig } from '~~/pm-core/app/composables/usePmConfig'

const props = withDefaults(
  defineProps<{
    /** Show contact buttons (set false in mobile menu where they're in header) */
    showContact?: boolean
    /** Language switcher direction: down (header), side (sidebar), inline (mobile menu) */
    langDirection?: 'down' | 'side' | 'inline'
  }>(),
  {
    showContact: true,
    langDirection: 'down'
  }
)

const { t } = useI18n()
const { settings } = useSiteSettings()
const config = usePmConfig()

// SSR-safe config access with defensive defaults
const hasContact = computed(() => {
  const selectedItems = parseHeaderQuickContactItems(settings.value?.contact.headerQuickItems)
  if (selectedItems.length > 0) return true

  return Array.isArray(config?.headerContact?.items) && config.headerContact.items.length > 0
})
const hasThemeToggle = computed(() => config?.hasThemeToggle ?? false)
const hasMultiLang = computed(() => config?.isMultiLang ?? false)
const hasLoginButton = computed(() => config?.hasLoginButton ?? false)
</script>

<template>
  <!-- Uses global header rail classes from skeleton/header.css -->
  <div class="header-actions-rail">
    <div class="header-actions">
      <!-- Existing header actions - hidden in mobile menu -->
      <MoleculesHeaderContact v-if="showContact && hasContact" mode="contacts" />

      <AtomsThemeToggle v-if="hasThemeToggle" />
      <AtomsLangSwitcher v-if="hasMultiLang" :direction="langDirection" />

      <!-- Login button - only in website-app mode -->
      <NuxtLink
        v-if="hasLoginButton"
        to="/login"
        class="header-login-btn action-surface action-surface--brand"
      >
        <IconLogin aria-hidden="true" />
        <span>{{ t('auth.login') }}</span>
      </NuxtLink>
    </div>

    <!-- Header CTA is a separate outermost action, after the existing action cluster. -->
    <MoleculesHeaderContact v-if="showContact && hasContact" class="header-cta" mode="cta" />
  </div>
</template>

<!-- No scoped styles needed - uses skeleton/header.css -->
