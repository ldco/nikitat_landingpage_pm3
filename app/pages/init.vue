<script setup lang="ts">
/**
 * Build Configuration Wizard
 *
 * Configures project settings for BUILD mode.
 * User reaches this page after running `npm run init` and selecting BUILD.
 *
 * Styles: app/assets/css/ui/content/init.css
 */
import '~/assets/css/runtime/init.css'
import IconWorld from '~icons/tabler/world'
import IconApps from '~icons/tabler/apps'
import IconCheck from '~icons/tabler/check'
import IconLoader from '~icons/tabler/loader-2'
import IconUpload from '~icons/tabler/upload'
import IconFileZip from '~icons/tabler/file-zip'
import IconX from '~icons/tabler/x'
import IconFile from '~icons/tabler/file-text'
import { getModulesForWizard, getLocalesForWizard } from '~~/shared/modules'
import { translateApiError } from '~/utils/api-errors'

definePageMeta({
  layout: 'blank',
  blankHeaderVariant: 'setup',
  blankFooter: false
})

const { t } = useI18n()

useHead({
  title: () => t('init.pageTitle')
})

// Phase state - complete-greenfield for new projects, complete-brownfield for imports
const phase = ref<'configure' | 'complete-greenfield' | 'complete-brownfield'>('configure')
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const validationErrors = ref<string[]>([])

// Configuration
const config = reactive({
  // Project info - gathered for Claude context
  projectName: '',
  projectDescription: '',
  targetAudience: '',
  technicalBrief: '', // Technical brief for Claude planning
  // AI Workflow selection
  aiWorkflow: 'claude' as 'claude' | 'qwen' | 'codex',
  // Project type
  projectType: 'website' as 'website' | 'app',
  adminEnabled: true,
  // Modules
  modules: ['contact'] as string[],
  customModules: '', // Free text for other modules needed
  // Features
  features: {
    cookies: true,
    multiLangs: false,
    doubleTheme: true,
    colorRenderFallback: true,
    onepager: false,
    heroParallax: false,
    scrollytelling: false,
    interactiveHeader: true,
    mobileInteractiveHeader: false,
    hideHeaderOnScroll: false,
    verticalNav: false,
    headerFooterWidthMode: 'contained' as 'contained' | 'full',
    pageTransitions: 'zoom' as string,
    appVerticalNav: false,
    pwa: false,
    twoFactorAuth: false,
    contactEmailConfirmation: false,
    contactTelegramNotify: false,
    footerNav: true,
    footerCta: true,
    footerLegalLinks: true,
    footerMadeBy: true,
    footerMadeWith: false,
    backToTop: true
  },
  // Appearance
  defaultTheme: 'system' as 'system' | 'light' | 'dark',
  // Header
  headerContactEnabled: true,
  // Locales
  locales: [{ code: 'en', iso: 'en-US', name: 'English' }] as Array<{
    code: string
    iso: string
    name: string
  }>,
  defaultLocale: 'en',
  customLocale: { code: '', name: '' } // For "Other" language
})

// Import zip upload
const importZipFile = ref<File | null>(null)
const uploadingZip = ref(false)
const importFolderFiles = ref<string[]>([])
const hasBrownfieldContent = ref(false)

// Current config from server
const currentConfig = ref<Record<string, unknown> | null>(null)

// Fetch current config on mount
onMounted(async () => {
  try {
    const data = await $fetch('/api/setup/config')
    currentConfig.value = data

    // Capture brownfield info
    if (data.hasBrownfieldContent) {
      hasBrownfieldContent.value = true
      importFolderFiles.value = data.importFolderFiles || []
    }

    // Load existing config values if available
    if (data.pmMode !== 'unconfigured') {
      config.aiWorkflow = data.aiWorkflow || 'claude'
      config.projectType = data.projectType || 'website'
      config.adminEnabled = data.adminEnabled
      config.modules = data.enabledModules || ['contact']
      config.features = data.features || config.features
      config.locales = data.locales || config.locales
      config.defaultLocale = data.defaultLocale || 'en'
      // Load project info if previously saved
      if (data.projectName) config.projectName = data.projectName
      if (data.projectDescription) config.projectDescription = data.projectDescription
      if (data.targetAudience) config.targetAudience = data.targetAudience
      if (data.technicalBrief) config.technicalBrief = data.technicalBrief
      if (data.customModules) config.customModules = data.customModules
    }
  } catch (e: unknown) {
    error.value = translateApiError(t, e, 'init.errors.loadConfiguration')
  } finally {
    loading.value = false
  }
})

// Available modules and locales from shared registry (single source of truth)
const availableModules = getModulesForWizard()
const availableLocales = getLocalesForWizard()

// Retry loading config
async function retryLoad() {
  error.value = ''
  loading.value = true
  try {
    const data = await $fetch('/api/setup/config')
    currentConfig.value = data
    if (data.hasBrownfieldContent) {
      hasBrownfieldContent.value = true
      importFolderFiles.value = data.importFolderFiles || []
    }
  } catch (e: unknown) {
    error.value = translateApiError(t, e, 'init.errors.loadConfiguration')
  } finally {
    loading.value = false
  }
}

// Module toggle
function toggleModule(moduleId: string) {
  const index = config.modules.indexOf(moduleId)
  if (index === -1) {
    config.modules.push(moduleId)
  } else {
    config.modules.splice(index, 1)
  }
}

// Locale toggle
function toggleLocale(locale: (typeof availableLocales)[0]) {
  const index = config.locales.findIndex(l => l.code === locale.code)
  if (index === -1) {
    config.locales.push(locale)
    if (config.locales.length === 1) {
      config.defaultLocale = locale.code
    }
  } else if (config.locales.length > 1) {
    config.locales.splice(index, 1)
    if (config.defaultLocale === locale.code) {
      config.defaultLocale = config.locales[0].code
    }
  }
}

// Add custom locale
function addCustomLocale() {
  if (!config.customLocale.code || !config.customLocale.name) return

  // Check if already exists
  if (config.locales.some(l => l.code === config.customLocale.code)) {
    error.value = t('init.errors.languageCodeExists')
    return
  }

  config.locales.push({
    code: config.customLocale.code.toLowerCase(),
    iso: `${config.customLocale.code.toLowerCase()}-${config.customLocale.code.toUpperCase()}`,
    name: config.customLocale.name
  })

  if (config.locales.length === 1) {
    config.defaultLocale = config.customLocale.code.toLowerCase()
  }

  // Clear the input
  config.customLocale = { code: '', name: '' }
}

// Zip file upload handler
async function handleZipUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!file.name.endsWith('.zip')) {
    error.value = t('init.errors.zipOnly')
    return
  }

  uploadingZip.value = true
  error.value = ''

  try {
    const formData = new FormData()
    formData.append('file', file)

    const result = await $fetch('/api/setup/import-zip', {
      method: 'POST',
      body: formData
    }) as { files: string[] }

    importZipFile.value = file
    importFolderFiles.value = result.files
    hasBrownfieldContent.value = result.files.length > 0
  } catch (e: unknown) {
    error.value = translateApiError(t, e, 'init.errors.uploadZip')
    importZipFile.value = null
  } finally {
    uploadingZip.value = false
  }
}

// Remove uploaded zip
async function removeImportZip() {
  try {
    await $fetch('/api/setup/import-zip', { method: 'DELETE' })
    importZipFile.value = null
    importFolderFiles.value = []
    hasBrownfieldContent.value = false
  } catch (e: unknown) {
    error.value = translateApiError(t, e, 'init.errors.removeImport')
  }
}

// Technical brief file upload handler
function handleBriefUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // Validate file extension
  const validExtensions = ['.md', '.txt', '.markdown']
  const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
  if (!hasValidExt) {
    error.value = t('init.errors.briefFileType')
    input.value = ''
    return
  }

  // Validate file size (max 500KB)
  if (file.size > 500 * 1024) {
    error.value = t('init.errors.briefFileSize')
    input.value = ''
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target?.result as string
    if (content) {
      config.technicalBrief = content
    }
  }
  reader.onerror = () => {
    error.value = t('init.errors.briefRead')
  }
  reader.readAsText(file)

  // Reset input so same file can be re-uploaded
  input.value = ''
}

// Validation
function validate(): boolean {
  validationErrors.value = []

  if (config.locales.length === 0) {
    validationErrors.value.push(t('init.errors.languageRequired'))
  }

  return validationErrors.value.length === 0
}

// Apply configuration
async function applyConfig() {
  if (!validate()) {
    return
  }

  saving.value = true
  error.value = ''

  try {
    await $fetch('/api/setup/config', {
      method: 'POST',
      body: {
        pmMode: 'build',
        aiWorkflow: config.aiWorkflow,
        // Project info (for Claude context)
        projectName: config.projectName,
        projectDescription: config.projectDescription,
        targetAudience: config.targetAudience,
        technicalBrief: config.technicalBrief,
        // Type and modules
        projectType: config.projectType,
        adminEnabled: config.adminEnabled,
        modules: config.modules,
        customModules: config.customModules,
        // Features and locales
        features: config.features,
        locales: config.locales,
        defaultLocale: config.defaultLocale,
        defaultTheme: config.defaultTheme,
        headerContactEnabled: config.headerContactEnabled
      }
    })

    // Always show completion screen - developer needs to start coding
    saving.value = false
    if (hasBrownfieldContent.value) {
      phase.value = 'complete-brownfield'
    } else {
      phase.value = 'complete-greenfield'
    }
  } catch (e: unknown) {
    error.value = translateApiError(t, e, 'init.errors.saveConfiguration')
    saving.value = false
  }
}

</script>

<template>
  <div class="setup-page">
    <!-- Loading -->
    <div v-if="loading" class="setup-loading">
      <IconLoader class="spinner" />
      <p>{{ t('init.loadingConfiguration') }}</p>
    </div>

    <!-- Configuration Form -->
    <main v-else-if="phase === 'configure'" class="setup-content setup-form">
      <!-- Error Banner -->
      <div v-if="error" class="error-banner">
        {{ error }}
      </div>

      <!-- Validation Errors -->
      <div v-if="validationErrors.length > 0" class="error-banner">
        <ul class="validation-errors">
          <li v-for="err in validationErrors" :key="err">{{ err }}</li>
        </ul>
      </div>

      <!-- Project Info -->
      <section class="setup-section">
        <h2 class="section-title">{{ t('init.projectInfo.title') }}</h2>
        <p class="section-desc">{{ t('init.projectInfo.description') }}</p>

        <div class="form-group">
          <label class="form-label">{{ t('init.projectInfo.projectName') }}</label>
          <input
            v-model="config.projectName"
            type="text"
            class="input"
            :placeholder="t('init.projectInfo.projectNamePlaceholder')"
          />
        </div>

        <div class="form-group">
          <label class="form-label">{{ t('init.projectInfo.projectDescription') }}</label>
          <textarea
            v-model="config.projectDescription"
            class="input"
            rows="3"
            :placeholder="t('init.projectInfo.projectDescriptionPlaceholder')"
          ></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">{{ t('init.projectInfo.targetAudience') }}</label>
          <input
            v-model="config.targetAudience"
            type="text"
            class="input"
            :placeholder="t('init.projectInfo.targetAudiencePlaceholder')"
          />
        </div>

        <div class="form-group">
          <label class="form-label">
            {{ t('init.projectInfo.technicalBrief') }}
            <span class="optional-badge">{{ t('common.optional') }}</span>
          </label>
          <div class="brief-input-wrapper">
            <textarea
              v-model="config.technicalBrief"
              class="input"
              rows="6"
              :placeholder="t('init.projectInfo.technicalBriefPlaceholder')"
            ></textarea>
            <div class="brief-upload">
              <input
                type="file"
                accept=".md,.txt,.markdown"
                id="brief-upload"
                class="upload-input"
                @change="handleBriefUpload"
              />
              <label for="brief-upload" class="btn btn-secondary btn-sm">
                <IconFile class="icon-sm" />
                {{ t('init.projectInfo.uploadBrief') }}
              </label>
            </div>
          </div>
          <p class="form-hint">{{ t('init.projectInfo.technicalBriefHint') }}</p>
        </div>
      </section>

      <!-- AI Workflow Selection -->
      <section class="setup-section">
        <h2 class="section-title">{{ t('init.workflow.title') }}</h2>
        <p class="section-desc">{{ t('init.workflow.description') }}</p>

        <div class="workflow-cards">
          <button
            class="workflow-card"
            :class="{ active: config.aiWorkflow === 'claude' }"
            @click="config.aiWorkflow = 'claude'"
          >
            <div class="workflow-info">
              <h3>{{ t('init.workflow.claudeTitle') }}</h3>
              <p>{{ t('init.workflow.claudeDescription') }}</p>
            </div>
            <IconCheck v-if="config.aiWorkflow === 'claude'" class="check-icon" />
          </button>

          <button
            class="workflow-card"
            :class="{ active: config.aiWorkflow === 'qwen' }"
            @click="config.aiWorkflow = 'qwen'"
          >
            <div class="workflow-info">
              <h3>{{ t('init.workflow.qwenTitle') }}</h3>
              <p>{{ t('init.workflow.qwenDescription') }}</p>
            </div>
            <IconCheck v-if="config.aiWorkflow === 'qwen'" class="check-icon" />
          </button>

          <button
            class="workflow-card"
            :class="{ active: config.aiWorkflow === 'codex' }"
            @click="config.aiWorkflow = 'codex'"
          >
            <div class="workflow-info">
              <h3>{{ t('init.workflow.codexTitle') }}</h3>
              <p>{{ t('init.workflow.codexDescription') }}</p>
            </div>
            <IconCheck v-if="config.aiWorkflow === 'codex'" class="check-icon" />
          </button>
        </div>
      </section>

      <!-- Project Type -->
      <section class="setup-section">
        <h2 class="section-title">{{ t('init.projectType.title') }}</h2>
        <p class="section-desc">{{ t('init.projectType.description') }}</p>

        <div class="type-cards">
          <button
            class="type-card"
            :class="{ active: config.projectType === 'website' }"
            @click="config.projectType = 'website'"
          >
            <IconWorld class="type-icon" />
            <div class="type-info">
              <h3>{{ t('init.projectType.websiteTitle') }}</h3>
              <p>{{ t('init.projectType.websiteDescription') }}</p>
            </div>
            <IconCheck v-if="config.projectType === 'website'" class="check-icon" />
          </button>

          <button
            class="type-card"
            :class="{ active: config.projectType === 'app' }"
            @click="config.projectType = 'app'"
          >
            <IconApps class="type-icon" />
            <div class="type-info">
              <h3>{{ t('init.projectType.appTitle') }}</h3>
              <p>{{ t('init.projectType.appDescription') }}</p>
            </div>
            <IconCheck v-if="config.projectType === 'app'" class="check-icon" />
          </button>
        </div>

        <label class="checkbox-label">
          <input v-model="config.adminEnabled" type="checkbox" />
          <span>{{ t('init.projectType.enableAdmin') }}</span>
        </label>
      </section>

      <!-- Import Existing Code (Optional) -->
      <section class="setup-section">
        <h2 class="section-title">
          {{ t('init.import.title') }}
          <span class="optional-badge">{{ t('common.optional') }}</span>
        </h2>
        <p class="section-desc">{{ t('init.import.description') }}</p>

        <div v-if="!importZipFile" class="upload-zone">
          <input
            type="file"
            accept=".zip"
            id="zip-upload"
            class="upload-input"
            :disabled="uploadingZip"
            @change="handleZipUpload"
          />
          <label for="zip-upload" class="upload-label">
            <IconUpload v-if="!uploadingZip" class="upload-icon" />
            <IconLoader v-else class="upload-icon spinner" />
            <span>{{ uploadingZip ? t('init.import.uploading') : t('init.import.uploadPrompt') }}</span>
            <span class="upload-hint">{{ t('init.import.uploadHint') }}</span>
          </label>
        </div>

        <div v-else class="import-detected">
          <div class="import-header">
            <IconFileZip class="zip-icon" />
            <div class="import-info">
              <strong>{{ importZipFile.name }}</strong>
              <span>{{ t('init.import.filesExtracted', { count: importFolderFiles.length }) }}</span>
            </div>
            <button class="btn-icon" @click="removeImportZip" :title="t('common.remove')">
              <IconX />
            </button>
          </div>
          <ul v-if="importFolderFiles.length > 0" class="import-files">
            <li v-for="file in importFolderFiles.slice(0, 5)" :key="file">{{ file }}</li>
            <li v-if="importFolderFiles.length > 5" class="more-files">
              {{ t('init.import.moreFiles', { count: importFolderFiles.length - 5 }) }}
            </li>
          </ul>
          <p class="import-note">
            {{ t('init.import.runCommandBefore') }}
            <code>/pm-migrate</code>
            {{ t('init.import.runCommandAfter') }}
          </p>
        </div>
      </section>

      <!-- Modules -->
      <section class="setup-section">
        <h2 class="section-title">{{ t('init.modules.title') }}</h2>
        <p class="section-desc">
          <template v-if="config.projectType === 'website'">
            {{ t('init.modules.websiteDescription') }}
          </template>
          <template v-else>
            {{ t('init.modules.appDescription') }}
          </template>
        </p>

        <!-- Pre-built modules (website only) -->
        <div v-if="config.projectType === 'website'" class="modules-grid">
          <button
            v-for="mod in availableModules"
            :key="mod.id"
            class="module-card"
            :class="{ active: config.modules.includes(mod.id) }"
            @click="toggleModule(mod.id)"
          >
            <IconCheck v-if="config.modules.includes(mod.id)" class="check-icon" />
            <h3>{{ mod.name }}</h3>
            <p>{{ mod.desc }}</p>
          </button>
        </div>

        <!-- App modules notice -->
        <div v-else class="info-box">
          <p>
            {{ t('init.modules.appNotice') }}
          </p>
        </div>

        <!-- Custom modules (always show) -->
        <div class="form-group mt-4">
          <label class="form-label">
            {{ t('init.modules.otherModules') }}
            <span class="optional-badge">{{ t('common.optional') }}</span>
          </label>
          <textarea
            v-model="config.customModules"
            class="input"
            rows="3"
            :placeholder="config.projectType === 'website'
              ? t('init.modules.websiteCustomPlaceholder')
              : t('init.modules.appCustomPlaceholder')"
          ></textarea>
          <p class="form-hint">{{ t('init.modules.customHint') }}</p>
        </div>
      </section>

      <!-- Languages -->
      <section class="setup-section">
        <h2 class="section-title">
          {{ t('init.languages.title') }}
          <span class="required-badge">{{ t('common.required') }}</span>
        </h2>
        <p class="section-desc">{{ t('init.languages.description') }}</p>

        <div class="locales-grid">
          <button
            v-for="locale in availableLocales"
            :key="locale.code"
            class="locale-chip"
            :class="{
              active: config.locales.some(l => l.code === locale.code),
              default: config.defaultLocale === locale.code
            }"
            @click="toggleLocale(locale)"
          >
            {{ locale.name }}
            <span v-if="config.defaultLocale === locale.code" class="default-badge">
              {{ t('init.languages.defaultBadge') }}
            </span>
          </button>
        </div>

        <!-- Custom Language Input -->
        <div class="custom-locale-input">
          <div class="custom-locale-fields">
            <input
              v-model="config.customLocale.code"
              type="text"
              class="input"
              :placeholder="t('init.languages.codePlaceholder')"
              maxlength="5"
            />
            <input
              v-model="config.customLocale.name"
              type="text"
              class="input"
              :placeholder="t('init.languages.namePlaceholder')"
            />
            <button
              type="button"
              class="btn btn-secondary"
              :disabled="!config.customLocale.code || !config.customLocale.name"
              @click="addCustomLocale"
            >
              {{ t('common.add') }}
            </button>
          </div>
          <p class="form-hint">{{ t('init.languages.customHint') }}</p>
        </div>

        <!-- Selected languages (if any custom added) -->
        <div v-if="config.locales.some(l => !availableLocales.find(a => a.code === l.code))" class="selected-locales">
          <p class="form-label">{{ t('init.languages.customAdded') }}</p>
          <div class="locales-grid">
            <button
              v-for="locale in config.locales.filter(l => !availableLocales.find(a => a.code === l.code))"
              :key="locale.code"
              class="locale-chip active"
              @click="toggleLocale(locale)"
            >
              {{ locale.name }} ({{ locale.code }})
              <span v-if="config.defaultLocale === locale.code" class="default-badge">
                {{ t('init.languages.defaultBadge') }}
              </span>
            </button>
          </div>
        </div>

        <div v-if="config.locales.length > 1" class="form-group">
          <label class="form-label">{{ t('init.languages.defaultLanguage') }}</label>
          <select v-model="config.defaultLocale" class="input">
            <option v-for="l in config.locales" :key="l.code" :value="l.code">
              {{ l.name }}
            </option>
          </select>
        </div>
      </section>

      <!-- Features -->
      <section class="setup-section">
        <h2 class="section-title">{{ t('init.features.title') }}</h2>
        <p class="section-desc">{{ t('init.features.description') }}</p>

        <div class="features-list">
          <label class="checkbox-label">
            <input v-model="config.features.cookies" type="checkbox" />
            <span>{{ t('init.features.cookies') }}</span>
          </label>
          <label class="checkbox-label">
            <input v-model="config.features.doubleTheme" type="checkbox" />
            <span>{{ t('init.features.doubleTheme') }}</span>
          </label>
          <label class="checkbox-label">
            <input v-model="config.features.onepager" type="checkbox" />
            <span>{{ t('init.features.onepager') }}</span>
          </label>
          <label class="checkbox-label">
            <input v-model="config.features.heroParallax" type="checkbox" />
            <span>{{ t('init.features.heroParallax') }}</span>
          </label>
          <label class="checkbox-label">
            <input v-model="config.features.scrollytelling" type="checkbox" />
            <span>{{ t('init.features.scrollytelling') }}</span>
          </label>
          <label class="checkbox-label">
            <input v-model="config.features.pwa" type="checkbox" />
            <span>{{ t('init.features.pwa') }}</span>
          </label>
          <label v-if="config.adminEnabled || config.projectType === 'app'" class="checkbox-label">
            <input v-model="config.features.twoFactorAuth" type="checkbox" />
            <span>{{ t('init.features.twoFactorAuth') }}</span>
          </label>
        </div>
      </section>

      <!-- Header & Navigation -->
      <section class="setup-section">
        <h2 class="section-title">{{ t('init.header.title') }}</h2>
        <p class="section-desc">{{ t('init.header.description') }}</p>

        <div class="features-list">
          <label class="checkbox-label">
            <input v-model="config.features.interactiveHeader" type="checkbox" />
            <span>{{ t('init.header.interactiveHeader') }}</span>
          </label>
          <label class="checkbox-label">
            <input v-model="config.features.mobileInteractiveHeader" type="checkbox" />
            <span>{{ t('init.header.mobileInteractiveHeader') }}</span>
          </label>
          <label class="checkbox-label">
            <input v-model="config.features.hideHeaderOnScroll" type="checkbox" />
            <span>{{ t('init.header.hideHeaderOnScroll') }}</span>
          </label>
          <label class="checkbox-label">
            <input v-model="config.features.verticalNav" type="checkbox" />
            <span>{{ t('init.header.verticalNav') }}</span>
          </label>
          <label v-if="config.adminEnabled || config.projectType === 'app'" class="checkbox-label">
            <input v-model="config.features.appVerticalNav" type="checkbox" />
            <span>{{ t('init.header.appVerticalNav') }}</span>
          </label>
          <label class="checkbox-label">
            <input v-model="config.headerContactEnabled" type="checkbox" />
            <span>{{ t('init.header.headerContact') }}</span>
          </label>
          <div class="form-group mt-2">
            <label class="form-label">{{ t('init.header.headerFooterWidthMode') }}</label>
            <select v-model="config.features.headerFooterWidthMode" class="input">
              <option value="contained">{{ t('init.header.widthContained') }}</option>
              <option value="full">{{ t('init.header.widthFull') }}</option>
            </select>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <section class="setup-section">
        <h2 class="section-title">{{ t('init.footer.title') }}</h2>
        <p class="section-desc">{{ t('init.footer.description') }}</p>

        <div class="features-list">
          <label class="checkbox-label">
            <input v-model="config.features.footerNav" type="checkbox" />
            <span>{{ t('init.footer.footerNav') }}</span>
          </label>
          <label class="checkbox-label">
            <input v-model="config.features.footerCta" type="checkbox" />
            <span>{{ t('init.footer.footerCta') }}</span>
          </label>
          <label class="checkbox-label">
            <input v-model="config.features.footerLegalLinks" type="checkbox" />
            <span>{{ t('init.footer.footerLegalLinks') }}</span>
          </label>
          <label class="checkbox-label">
            <input v-model="config.features.footerMadeBy" type="checkbox" />
            <span>{{ t('init.footer.footerMadeBy') }}</span>
          </label>
          <label class="checkbox-label">
            <input v-model="config.features.footerMadeWith" type="checkbox" />
            <span>{{ t('init.footer.footerMadeWith') }}</span>
          </label>
          <label class="checkbox-label">
            <input v-model="config.features.backToTop" type="checkbox" />
            <span>{{ t('init.footer.backToTop') }}</span>
          </label>
        </div>
      </section>

      <!-- Contact & Notifications -->
      <section v-if="config.modules.includes('contact')" class="setup-section">
        <h2 class="section-title">{{ t('init.contact.title') }}</h2>
        <p class="section-desc">{{ t('init.contact.description') }}</p>

        <div class="features-list">
          <label class="checkbox-label">
            <input v-model="config.features.contactEmailConfirmation" type="checkbox" />
            <span>{{ t('init.contact.emailConfirmation') }}</span>
          </label>
          <label class="checkbox-label">
            <input v-model="config.features.contactTelegramNotify" type="checkbox" />
            <span>{{ t('init.contact.telegramNotify') }}</span>
          </label>
        </div>
      </section>

      <!-- Appearance -->
      <section class="setup-section">
        <h2 class="section-title">{{ t('init.appearance.title') }}</h2>
        <p class="section-desc">{{ t('init.appearance.description') }}</p>

        <div class="features-list">
          <label class="checkbox-label">
            <input v-model="config.features.colorRenderFallback" type="checkbox" />
            <span>{{ t('init.appearance.colorRenderFallback') }}</span>
          </label>
          <div class="form-group mt-2">
            <label class="form-label">{{ t('init.appearance.defaultTheme') }}</label>
            <select v-model="config.defaultTheme" class="input">
              <option value="system">{{ t('init.appearance.themeSystem') }}</option>
              <option value="light">{{ t('init.appearance.themeLight') }}</option>
              <option value="dark">{{ t('init.appearance.themeDark') }}</option>
            </select>
          </div>
          <div class="form-group mt-2">
            <label class="form-label">{{ t('init.appearance.pageTransitions') }}</label>
            <select v-model="config.features.pageTransitions" class="input">
              <option value="">{{ t('init.appearance.transitionNone') }}</option>
              <option value="fade">{{ t('init.appearance.transitionFade') }}</option>
              <option value="slide-left">{{ t('init.appearance.transitionSlideLeft') }}</option>
              <option value="slide-up">{{ t('init.appearance.transitionSlideUp') }}</option>
              <option value="scale">{{ t('init.appearance.transitionScale') }}</option>
              <option value="zoom">{{ t('init.appearance.transitionZoom') }}</option>
              <option value="flip">{{ t('init.appearance.transitionFlip') }}</option>
              <option value="rotate">{{ t('init.appearance.transitionRotate') }}</option>
              <option value="blur">{{ t('init.appearance.transitionBlur') }}</option>
              <option value="bounce">{{ t('init.appearance.transitionBounce') }}</option>
              <option value="swipe">{{ t('init.appearance.transitionSwipe') }}</option>
            </select>
          </div>
        </div>
      </section>

      <!-- Database Warning -->
      <div v-if="currentConfig?.databaseExists" class="warning-box">
        <strong>{{ t('common.note') }}:</strong> {{ t('init.database.existsWarning') }}
      </div>

      <!-- Actions -->
      <div class="form-actions form-actions-center">
        <button
          class="btn btn-primary btn-lg"
          @click="applyConfig"
          :disabled="saving"
        >
          <IconLoader v-if="saving" class="spinner" />
          <IconCheck v-else />
          {{ saving ? t('init.actions.applying') : t('init.actions.apply') }}
        </button>
      </div>
    </main>

    <!-- Complete Phase: Greenfield (new project) -->
    <main v-else-if="phase === 'complete-greenfield'" class="setup-content">
      <div class="complete-phase">
        <div class="complete-icon">
          <IconCheck />
        </div>
        <h1 class="complete-title">{{ t('init.complete.greenfieldTitle') }}</h1>
        <p class="complete-desc">
          {{ t('init.complete.greenfieldDescription') }}<br />
          {{ t('init.complete.startBuilding', { projectType: config.projectType }) }}
        </p>

        <div v-if="config.technicalBrief" class="complete-steps">
          <div class="step">
            <span class="step-num">1</span>
            <div class="step-content">
              <strong>{{ t('init.complete.generatePlan') }}</strong>
              <p>{{ t('init.complete.generatePlanDescription') }}</p>
              <code>/pm-plan</code>
            </div>
          </div>
        </div>

        <div class="complete-info">
          <div class="info-item">
            <strong>{{ t('init.complete.devServer') }}</strong>
            <a href="http://localhost:3000" target="_blank" class="dev-link">http://localhost:3000</a>
          </div>
          <div class="info-item">
            <strong>{{ t('init.complete.configuration') }}</strong>
            <code>project/puppet-master.config.ts</code>
          </div>
        </div>

        <div class="complete-dirs">
          <strong>{{ t('init.complete.keyDirectories') }}</strong>
          <div class="dir-grid">
            <div class="dir-item">
              <code>app/pages/</code>
              <span>{{ t('init.complete.routePages') }}</span>
            </div>
            <div class="dir-item">
              <code>app/components/</code>
              <span>{{ t('init.complete.vueComponents') }}</span>
            </div>
            <div class="dir-item">
              <code>server/api/</code>
              <span>{{ t('init.complete.apiEndpoints') }}</span>
            </div>
            <div class="dir-item">
              <code>app/assets/css/</code>
              <span>{{ t('init.complete.styles') }}</span>
            </div>
          </div>
        </div>

        <div v-if="config.adminEnabled" class="complete-hint">
          {{ t('init.complete.adminAvailable') }} <a href="/admin">/admin</a>
        </div>
      </div>
    </main>

    <!-- Complete Phase: Brownfield (imported code) -->
    <main v-else-if="phase === 'complete-brownfield'" class="setup-content">
      <div class="complete-phase">
        <div class="complete-icon">
          <IconCheck />
        </div>
        <h1 class="complete-title">{{ t('init.complete.brownfieldTitle') }}</h1>
        <p class="complete-desc">
          {{ t('init.complete.brownfieldDescription') }}
        </p>

        <div class="complete-steps">
          <div class="step">
            <span class="step-num">1</span>
            <div class="step-content">
              <strong>{{ t('init.complete.withClaude') }}</strong>
              <p>{{ t('init.complete.runMigrationAnalysis') }}</p>
              <code>/pm-migrate</code>
              <p class="step-note">{{ t('init.complete.migrationAnalysisNote') }}</p>
            </div>
          </div>
          <div class="step step-alt">
            <span class="step-num">{{ t('common.or') }}</span>
            <div class="step-content">
              <strong>{{ t('init.complete.withoutClaude') }}</strong>
              <p>{{ t('init.complete.filesIn') }} <code>./import/</code></p>
              <p class="step-note">{{ t('init.complete.manualReferenceNote') }}</p>
            </div>
          </div>
        </div>

        <div class="complete-files">
          <strong>{{ t('init.complete.uploadedFiles') }}:</strong>
          <div class="file-count">
            {{ t('init.complete.filesInImport', { count: importFolderFiles.length }) }}
          </div>
        </div>

        <div class="complete-info">
          <div class="info-item">
            <strong>{{ t('init.complete.devServer') }}</strong>
            <a href="http://localhost:3000" target="_blank" class="dev-link">http://localhost:3000</a>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<!-- Styles in: app/assets/css/ui/content/init.css -->
