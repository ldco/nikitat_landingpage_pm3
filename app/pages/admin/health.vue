<script setup lang="ts">
/**
 * Admin Health Page
 *
 * Server health metrics dashboard for master users only.
 * Displays: system status, recent logs, audit trail, external monitoring link.
 *
 * Uses global CSS: .card, .badge, .data-table, .btn, .flex, .grid utilities
 */
import '~/assets/css/runtime/admin-health.css'
import IconRefresh from '~icons/tabler/refresh'
import IconExternalLink from '~icons/tabler/external-link'
import IconCheck from '~icons/tabler/check'
import IconAlertTriangle from '~icons/tabler/alert-triangle'
import IconX from '~icons/tabler/x'
import IconCopy from '~icons/tabler/copy'
import IconDownload from '~icons/tabler/download'
import IconChevronDown from '~icons/tabler/chevron-down'
import IconTerminal2 from '~icons/tabler/terminal-2'
import IconPlayerPlay from '~icons/tabler/player-play'
import type {
  HealthData,
  LogEntry,
  AuditLogEntry,
  TerminalCommandResult,
  TerminalCommandOption,
  MonitoringMetric,
  MonitoringSummary,
  OpsActionDefinition,
  OpsActionResult,
  OpsContainerStatus,
  OpsLogResponse,
  OpsPathStatus,
  OpsSummary,
  SupportBundle
} from '~~/pm-core/app/types'
import { translateApiError } from '~/utils/api-errors'

interface AuditLogsResponse {
  logs: AuditLogEntry[]
  meta: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  pageTransition: false
})

const { t, te, locale } = useI18n()
const requestHeaders = useRequestHeaders(['cookie'])

useHead({
  title: () => `${t('admin.navHealth')} | ${t('admin.titleSuffix')}`
})

const { toast } = useToast()
const config = useRuntimeConfig()

// Auto-refresh toggle
const autoRefresh = ref(true)
const refreshInterval = ref<ReturnType<typeof setInterval> | null>(null)
const logLevel = ref('all')
const auditPage = ref(1)
const auditPageSize = 25
const collapsedHealthSections = ref<Set<string>>(new Set())
const terminalCommand = ref('help')
const terminalPending = ref(false)
const terminalError = ref('')
const terminalHistory = ref<TerminalCommandResult[]>([])
const opsActionPending = ref('')
const opsActionError = ref('')
const opsActionResult = ref<OpsActionResult | null>(null)
type OpsLogContainer = 'app' | 'traefik'
const opsLogContainer = ref<OpsLogContainer>('app')
const opsLogContainerMenuOpen = ref(false)
const opsLogs = ref<OpsLogResponse | null>(null)
const opsLogsPending = ref(false)
const opsLogsError = ref('')
const supportBundlePending = ref(false)
const opsLogContainerOptions: Array<{ value: OpsLogContainer; labelKey: string; fallback: string }> = [
  { value: 'app', labelKey: 'admin.healthPage.opsLogContainer.app', fallback: 'App' },
  { value: 'traefik', labelKey: 'admin.healthPage.opsLogContainer.traefik', fallback: 'Traefik' }
]

// Fetch health data
const {
  data: healthData,
  pending: healthPending,
  error: healthError,
  refresh: refreshHealth
} = await useAsyncData('admin-health', () =>
  apiFetch<HealthData>('/api/admin/health', { headers: requestHeaders })
)

const {
  data: monitoringData,
  pending: monitoringPending,
  error: monitoringError,
  refresh: refreshMonitoring
} = await useAsyncData('admin-monitoring-summary', () =>
  apiFetch<MonitoringSummary>('/api/admin/monitoring/summary', { headers: requestHeaders })
)

const {
  data: opsData,
  pending: opsPending,
  refresh: refreshOps
} = await useAsyncData('admin-ops-summary', () =>
  apiFetch<OpsSummary>('/api/admin/ops/summary', { headers: requestHeaders })
)

const {
  data: terminalCommandsData,
  refresh: refreshTerminalCommands
} = await useAsyncData('admin-terminal-commands', () =>
  apiFetch<{ commands: TerminalCommandOption[] }>('/api/admin/terminal/commands', { headers: requestHeaders })
)

// Fetch logs
const {
  data: logsData,
  pending: logsPending,
  error: logsError,
  refresh: refreshLogs
} = await useAsyncData(
  'admin-logs',
  () =>
    apiFetch<{ logs: LogEntry[]; meta: Record<string, unknown> }>('/api/admin/logs', {
      headers: requestHeaders,
      query: {
        limit: 100,
        level: logLevel.value === 'all' ? undefined : logLevel.value
      }
    }),
  {
    watch: [logLevel]
  }
)

// Fetch audit logs
const {
  data: auditData,
  pending: auditPending,
  error: auditError,
  refresh: refreshAudit
} = await useAsyncData(
  'admin-audit-logs',
  () =>
    apiFetch<AuditLogsResponse>('/api/admin/audit-logs', {
      headers: requestHeaders,
      query: {
        limit: auditPageSize,
        offset: (auditPage.value - 1) * auditPageSize
      }
    }),
  {
    watch: [auditPage]
  }
)

// Computed values
const logs = computed(() => logsData.value?.logs || [])
const auditLogs = computed(() => auditData.value?.logs || [])
const activeLocale = computed(() => locale.value || 'en')
const auditTotal = computed(() => auditData.value?.meta.total || 0)
const auditTotalPages = computed(() => Math.max(1, Math.ceil(auditTotal.value / auditPageSize)))
const auditPageStart = computed(() => (auditTotal.value === 0 ? 0 : (auditPage.value - 1) * auditPageSize + 1))
const auditPageEnd = computed(() => Math.min(auditPage.value * auditPageSize, auditTotal.value))
const auditHasPreviousPage = computed(() => auditPage.value > 1)
const auditHasNextPage = computed(() => auditPage.value < auditTotalPages.value)
const monitoringMetrics = computed(() => monitoringData.value?.metrics || [])
const terminalCommandOptions = computed(() => terminalCommandsData.value?.commands || [])
const opsContainers = computed(() => opsData.value?.containers || [])
const opsActions = computed(() => opsData.value?.agent?.actions || [])
const opsLogContainerLabel = computed(() => {
  const option = opsLogContainerOptions.find(item => item.value === opsLogContainer.value)
  if (!option) return opsLogContainer.value
  return translateHealthLabel(option.labelKey, option.fallback)
})

function isHealthSectionCollapsed(section: string): boolean {
  return collapsedHealthSections.value.has(section)
}

function toggleHealthSection(section: string) {
  const next = new Set(collapsedHealthSections.value)
  if (next.has(section)) {
    next.delete(section)
  } else {
    next.add(section)
  }
  collapsedHealthSections.value = next
}

function previousAuditPage() {
  if (auditHasPreviousPage.value) {
    auditPage.value -= 1
  }
}

function nextAuditPage() {
  if (auditHasNextPage.value) {
    auditPage.value += 1
  }
}

// Format uptime
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (days > 0) {
    return t('admin.healthPage.uptimeDays', { days, hours, minutes })
  }
  if (hours > 0) {
    return t('admin.healthPage.uptimeHours', { hours, minutes })
  }
  return t('admin.healthPage.uptimeMinutes', { minutes })
}

// Format timestamp
function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString(activeLocale.value, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC'
  })
}

// Format date
function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString(activeLocale.value, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  })
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString(activeLocale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC'
  })
}

// Get status badge class
function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'ok':
      return 'badge-success'
    case 'warning':
    case 'degraded':
      return 'badge-warning'
    case 'error':
    case 'unhealthy':
      return 'badge-error'
    case 'unavailable':
      return 'badge-secondary'
    default:
      return 'badge-secondary'
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'ok':
      return IconCheck
    case 'warning':
    case 'degraded':
      return IconAlertTriangle
    case 'error':
    case 'unhealthy':
      return IconX
    case 'unavailable':
      return IconAlertTriangle
    default:
      return IconAlertTriangle
  }
}

const statusFallbacks: Record<string, Record<string, string>> = {
  en: {
    ok: 'OK',
    warning: 'Warning',
    error: 'Error',
    degraded: 'Degraded',
    unhealthy: 'Unhealthy',
    unavailable: 'Unavailable'
  },
  ru: {
    ok: 'ОК',
    warning: 'Внимание',
    error: 'Ошибка',
    degraded: 'Сбой',
    unhealthy: 'Неисправно',
    unavailable: 'Недоступно'
  },
  he: {
    ok: 'תקין',
    warning: 'אזהרה',
    error: 'שגיאה',
    degraded: 'חלקי',
    unhealthy: 'לא תקין',
    unavailable: 'לא זמין'
  }
}

function getStatusLabel(status: string): string {
  const key = `admin.healthPage.status.${status}`
  if (te(key)) return t(key)

  const localeCode = activeLocale.value.split('-')[0] || 'en'
  return statusFallbacks[localeCode]?.[status] || statusFallbacks.en[status] || status
}

function translateHealthLabel(key: string, fallback: string): string {
  return te(key) ? t(key) : fallback
}

function selectOpsLogContainer(container: OpsLogContainer) {
  opsLogContainer.value = container
  opsLogContainerMenuOpen.value = false
}

function handleOpsLogContainerClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  if (!target?.closest('.pm-select')) {
    opsLogContainerMenuOpen.value = false
  }
}

function getHealthCheckLabel(name: string): string {
  const key = `admin.healthPage.check.${name}`
  return te(key) ? t(key) : name
}

function getTerminalCommandLabel(option: TerminalCommandOption): string {
  return te(option.labelKey) ? t(option.labelKey) : option.command
}

function getDetailNumber(details: Record<string, unknown> | undefined, key: string): number | null {
  const value = details?.[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function formatHealthCheckValue(check: { name: string; latency?: number; details?: Record<string, unknown> }): string {
  const percentage = getDetailNumber(check.details, 'percentage')
  const usedMB = getDetailNumber(check.details, 'usedMB')
  const totalMB = getDetailNumber(check.details, 'totalMB')
  const entries = getDetailNumber(check.details, 'entries')
  const maxEntries = getDetailNumber(check.details, 'maxEntries')
  const load1m = getDetailNumber(check.details, 'load1m')
  const cores = getDetailNumber(check.details, 'cores')

  if (check.name === 'database' && check.latency !== undefined) {
    return `${check.latency}ms`
  }

  if ((check.name === 'ram' || check.name === 'nodeHeap' || check.name.startsWith('disk')) && percentage !== null) {
    if (usedMB !== null && totalMB !== null) {
      return `${percentage}% (${usedMB}/${totalMB} MB)`
    }
    return `${percentage}%`
  }

  if (check.name === 'logBuffer' && entries !== null && maxEntries !== null) {
    return `${entries}/${maxEntries}`
  }

  if (check.name === 'cpu' && percentage !== null) {
    if (load1m !== null && cores !== null) {
      return `${percentage}% (${load1m}/${cores})`
    }
    return `${percentage}%`
  }

  return ''
}

function getHealthCheckScopeLabel(check: { details?: Record<string, unknown> }): string {
  const scope = check.details?.scope
  if (typeof scope !== 'string') return ''

  const key = `admin.healthPage.scope.${scope}`
  return te(key) ? t(key) : scope
}

function getMonitoringMetricLabel(metric: MonitoringMetric): string {
  const key = `admin.healthPage.monitoring.metric.${metric.id}`
  return te(key) ? t(key) : metric.label || metric.id
}

function formatMonitoringValue(metric: MonitoringMetric): string {
  if (metric.value === null) return t('admin.healthPage.monitoringNoData')
  return formatMonitoringNumber(metric, metric.value)
}

function formatMonitoringNumber(metric: MonitoringMetric, value: number): string {
  const formatted = metric.unit ? value.toFixed(1) : value.toFixed(2)
  return `${formatted}${metric.unit ? ` ${metric.unit}` : ''}`
}

function getMonitoringStats(metric: MonitoringMetric): { min: string; avg: string; max: string } | null {
  const values = metric.points
    .map(point => point.value)
    .filter(value => Number.isFinite(value))

  if (values.length === 0) return null

  const min = Math.min(...values)
  const max = Math.max(...values)
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length

  return {
    min: formatMonitoringNumber(metric, min),
    avg: formatMonitoringNumber(metric, avg),
    max: formatMonitoringNumber(metric, max)
  }
}

function getMonitoringTimeRange(metric: MonitoringMetric): string {
  const points = metric.points.filter(point => point.timestamp)
  const first = points[0]
  const last = points[points.length - 1]

  if (!first || !last) return ''

  return `${formatMonitoringTime(first.timestamp)}-${formatMonitoringTime(last.timestamp)}`
}

function getMonitoringSourceLabel(metric: MonitoringMetric): string {
  if (metric.detail) return metric.detail
  if (metric.status === 'unavailable' || metric.value === null) return ''
  if (!metric.chart) return ''
  return metric.chart.replace(/^chart:\/\//, '').replace(/^hosts\.[^/]+\//, '')
}

function getMonitoringCurrentPoint(metric: MonitoringMetric): string {
  if (metric.value === null) return ''
  const points = getMonitoringChartPoints(metric)
  const last = points[points.length - 1]
  if (!last) return ''
  return `${last.x.toFixed(1)},${last.y.toFixed(1)}`
}

function getMonitoringChartPoints(metric: MonitoringMetric): Array<{ x: number; y: number }> {
  const points = metric.points.filter(point => Number.isFinite(point.value))
  if (points.length < 2) return []

  const values = points.map(point => point.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const width = 160
  const height = 54
  const paddingTop = 4
  const paddingBottom = 6
  const chartHeight = height - paddingTop - paddingBottom

  return points.map((point, index) => {
    const x = (index / (points.length - 1)) * width
    const y = paddingTop + chartHeight - ((point.value - min) / range) * chartHeight
    return { x, y }
  })
}

function getMonitoringSparklinePoints(metric: MonitoringMetric): string {
  return getMonitoringChartPoints(metric)
    .map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(' ')
}

function getMonitoringChartLabel(metric: MonitoringMetric): string {
  const stats = getMonitoringStats(metric)
  if (!stats) return `${getMonitoringMetricLabel(metric)} ${formatMonitoringValue(metric)}`
  return `${getMonitoringMetricLabel(metric)} ${formatMonitoringValue(metric)}, min ${stats.min}, avg ${stats.avg}, max ${stats.max}`
}

function getMonitoringStatItems(metric: MonitoringMetric): Array<{ key: string; label: string; value: string }> {
  const stats = getMonitoringStats(metric)
  if (!stats) return []

  return [
    { key: 'min', label: t('admin.healthPage.monitoringMin'), value: stats.min },
    { key: 'avg', label: t('admin.healthPage.monitoringAvg'), value: stats.avg },
    { key: 'max', label: t('admin.healthPage.monitoringMax'), value: stats.max }
  ]
}

function getMonitoringValueClass(metric: MonitoringMetric): string {
  if (metric.value === null) return 'monitoring-card__value monitoring-card__value--empty'
  return 'monitoring-card__value'
}

function formatBytes(bytes: number | null | undefined): string {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes)) return ''
  const units = ['B', 'KiB', 'MiB', 'GiB']
  let value = bytes
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

function getOpsContainerBadge(container: OpsContainerStatus): string {
  if (container.health === 'healthy' || container.state === 'running') return 'badge-success'
  if (container.state === 'restarting' || container.health === 'starting') return 'badge-warning'
  return 'badge-error'
}

function getOpsContainerLabel(container: OpsContainerStatus): string {
  return container.health || container.state || container.status
}

function getOpsPathStatus(pathStatus: OpsPathStatus | undefined): string {
  if (!pathStatus) return 'unknown'
  if (!pathStatus.exists) return 'missing'
  if (!pathStatus.writable) return 'not writable'
  return 'writable'
}

function getOpsPathBadge(pathStatus: OpsPathStatus | undefined): string {
  if (!pathStatus?.exists || !pathStatus?.writable) return 'badge-error'
  return 'badge-success'
}

function getOpsProblems(): string[] {
  const problems: string[] = []
  const ops = opsData.value
  if (!ops?.available) return [ops?.error || 'Ops agent unavailable']

  if (!ops.agent?.dockerSocket) problems.push('Docker socket is unavailable to the ops agent')
  for (const container of ops.containers || []) {
    if (container.state !== 'running') problems.push(`${container.name} is ${container.state}`)
    if (container.restartCount && container.restartCount > 0) problems.push(`${container.name} restarted ${container.restartCount} time(s)`)
    if (container.health && !['healthy', 'starting'].includes(container.health)) problems.push(`${container.name} health is ${container.health}`)
  }

  if (ops.database?.migrations?.pending && ops.database.migrations.pending > 0) {
    problems.push(`${ops.database.migrations.pending} database migration(s) pending`)
  }
  if (ops.database?.migrations?.error) problems.push(`Migration journal: ${ops.database.migrations.error}`)
  if (!ops.database?.file?.writable) problems.push('SQLite database is not writable')
  if (!ops.database?.backupDir?.writable) problems.push('Backup directory is not writable')
  if (!ops.storage?.uploads?.writable) problems.push('Uploads directory is not writable')
  if (!ops.storage?.temp?.writable) problems.push('Temp directory is not writable')

  return problems
}

async function runOpsAction(action: OpsActionDefinition) {
  if (opsActionPending.value) return
  const confirm = action.dangerous ? window.prompt(`Type ${action.id} to confirm`) : undefined
  if (action.dangerous && confirm !== action.id) return

  opsActionPending.value = action.id
  opsActionError.value = ''
  opsActionResult.value = null
  try {
    opsActionResult.value = await apiFetch<OpsActionResult>('/api/admin/ops/action', {
      method: 'POST',
      body: {
        action: action.id,
        confirm
      }
    })
    await refreshOps()
  } catch (error) {
    opsActionError.value = translateApiError(t, error, 'admin.healthPage.opsActionFailed')
  } finally {
    opsActionPending.value = ''
  }
}

async function loadOpsLogs() {
  opsLogsPending.value = true
  opsLogsError.value = ''
  try {
    opsLogs.value = await apiFetch<OpsLogResponse>('/api/admin/ops/logs', {
      query: {
        container: opsLogContainer.value,
        tail: 200
      }
    })
  } catch (error) {
    opsLogsError.value = translateApiError(t, error, 'admin.healthPage.opsLogsFailed')
  } finally {
    opsLogsPending.value = false
  }
}

async function getSupportBundleJson(): Promise<string> {
  const bundle = await apiFetch<SupportBundle>('/api/admin/support-bundle')
  return JSON.stringify({
    ...bundle,
    clientContext: {
      pageUrl: import.meta.client ? window.location.href : '',
      locale: activeLocale.value,
      selectedLogLevel: logLevel.value,
      selectedOpsLogContainer: opsLogContainer.value
    }
  }, null, 2)
}

async function copySupportBundle() {
  supportBundlePending.value = true
  try {
    await navigator.clipboard.writeText(await getSupportBundleJson())
    toast.success(translateHealthLabel('admin.healthPage.supportBundleCopied', 'Support bundle copied'))
  } catch {
    toast.error(translateHealthLabel('admin.healthPage.supportBundleCopyFailed', 'Failed to copy support bundle'))
  } finally {
    supportBundlePending.value = false
  }
}

async function downloadSupportBundle() {
  supportBundlePending.value = true
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const blob = new Blob([await getSupportBundleJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `pm-support-bundle-${timestamp}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success(translateHealthLabel('admin.healthPage.supportBundleDownloaded', 'Support bundle downloaded'))
  } catch {
    toast.error(translateHealthLabel('admin.healthPage.supportBundleDownloadFailed', 'Failed to export support bundle'))
  } finally {
    supportBundlePending.value = false
  }
}

function formatMonitoringTime(timestamp: number): string {
  if (!timestamp) return ''
  return formatTime(new Date(timestamp * 1000).toISOString())
}

// Get log level badge class
function getLogLevelClass(level: number): string {
  if (level >= 50) return 'badge-error' // error, fatal
  if (level >= 40) return 'badge-warning' // warn
  if (level >= 30) return 'badge-info' // info
  return 'badge-secondary' // debug, trace
}

// Refresh all data
async function refreshAll() {
  await Promise.all([refreshHealth(), refreshMonitoring(), refreshOps(), refreshTerminalCommands(), refreshLogs(), refreshAudit()])
}

async function runTerminalCommand() {
  const command = terminalCommand.value.trim()
  if (!command || terminalPending.value) return

  terminalPending.value = true
  terminalError.value = ''

  try {
    const result = await apiFetch<TerminalCommandResult>('/api/admin/terminal', {
      method: 'POST',
      body: { command }
    })
    terminalHistory.value = [...terminalHistory.value, result]
    terminalCommand.value = ''
  } catch (error: unknown) {
    terminalError.value = translateApiError(t, error, 'admin.healthPage.failedRunTerminalCommand')
  } finally {
    terminalPending.value = false
  }
}

// Copy logs to clipboard
async function copyLogs() {
  const logText = logs.value
    .map(log => `${log.time} [${log.levelLabel.toUpperCase()}] ${log.msg}`)
    .join('\n')

  try {
    await navigator.clipboard.writeText(logText)
    toast.success(t('admin.healthPage.logsCopied'))
  } catch {
    toast.error(t('admin.healthPage.copyLogsFailed'))
  }
}

// Auto-refresh logic
function stopAutoRefresh() {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}

function startAutoRefresh() {
  stopAutoRefresh()
  refreshInterval.value = setInterval(refreshAll, 30000)
}

watch(autoRefresh, enabled => {
  if (enabled) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
})

onMounted(() => {
  if (autoRefresh.value) {
    startAutoRefresh()
  }
  document.addEventListener('click', handleOpsLogContainerClickOutside)
})

onUnmounted(() => {
  stopAutoRefresh()
  document.removeEventListener('click', handleOpsLogContainerClickOutside)
})

// Last updated display
const lastUpdated = computed(() => {
  if (!healthData.value?.timestamp) return ''
  return formatTime(healthData.value.timestamp)
})

const healthErrorMessage = computed(() => {
  if (!healthError.value) return ''
  return translateApiError(t, healthError.value, 'admin.healthPage.failedLoadHealthData')
})

const logsErrorMessage = computed(() => {
  if (!logsError.value) return ''
  return translateApiError(t, logsError.value, 'admin.healthPage.failedLoadLogs')
})

const auditErrorMessage = computed(() => {
  if (!auditError.value) return ''
  return translateApiError(t, auditError.value, 'admin.healthPage.failedLoadAuditLogs')
})

const monitoringErrorMessage = computed(() => {
  if (!monitoringError.value) return ''
  return translateApiError(t, monitoringError.value, 'admin.healthPage.failedLoadMonitoring')
})

// Uptime Kuma URL from config
const uptimeKumaUrl = computed(() => config.public.uptimeKumaUrl || '')
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="page-header">
      <h1 class="page-title">{{ t('admin.health') }}</h1>
      <div class="page-actions">
        <label class="toggle toggle--sm">
          <input v-model="autoRefresh" type="checkbox" />
          <span class="toggle-track"></span>
          <span class="toggle-label">{{ t('admin.healthPage.autoRefresh') }}</span>
        </label>
        <button class="btn btn-sm btn-outline" :disabled="healthPending || monitoringPending" @click="refreshAll">
          <IconRefresh :class="{ spin: healthPending || monitoringPending }" />
          {{ t('common.refresh') }}
        </button>
      </div>
    </div>

    <div class="admin-page-content">
      <section class="support-bundle-panel mb-6">
        <div class="support-bundle-panel__content">
          <h2 class="support-bundle-panel__title">
            {{ translateHealthLabel('admin.healthPage.supportBundleTitle', 'Diagnostic support bundle') }}
          </h2>
          <p class="support-bundle-panel__description">
            {{
              translateHealthLabel(
                'admin.healthPage.supportBundleDescription',
                'Copy or export one redacted JSON snapshot with health checks, runtime versions, monitoring, recent logs, audit summary, container status, and client context. Paste it into an agent or issue when debugging production problems.'
              )
            }}
          </p>
        </div>
        <div class="support-bundle-panel__actions">
          <button
            class="btn btn-sm btn-secondary"
            :disabled="supportBundlePending"
            :title="translateHealthLabel('admin.healthPage.copySupportBundle', 'Copy support bundle')"
            @click="copySupportBundle"
          >
            <IconCopy />
            {{ translateHealthLabel('admin.healthPage.copySupportBundle', 'Copy JSON') }}
          </button>
          <button
            class="btn btn-sm btn-outline"
            :disabled="supportBundlePending"
            :title="translateHealthLabel('admin.healthPage.downloadSupportBundle', 'Download support bundle')"
            @click="downloadSupportBundle"
          >
            <IconDownload />
            {{ translateHealthLabel('admin.healthPage.downloadSupportBundle', 'Export JSON') }}
          </button>
        </div>
      </section>

      <!-- System Status -->
      <section class="card mb-6">
        <div class="card-header health-section__header">
          <button
            type="button"
            class="health-section__toggle"
            :aria-expanded="!isHealthSectionCollapsed('system')"
            @click="toggleHealthSection('system')"
          >
            <IconChevronDown
              class="health-section__chevron"
              :class="{ 'is-collapsed': isHealthSectionCollapsed('system') }"
            />
            <span class="card-title">{{ t('admin.healthPage.systemStatus') }}</span>
          </button>
          <span v-if="lastUpdated" class="text-sm text-secondary">
            {{ t('admin.healthPage.lastUpdated', { time: lastUpdated }) }}
          </span>
        </div>
        <div v-if="!isHealthSectionCollapsed('system')" class="card-body">
          <div v-if="healthPending" class="loading-state">
            <p>{{ t('common.loading') }}</p>
          </div>
          <div v-else-if="healthError" class="empty-state">
            <p>{{ t('admin.healthPage.failedLoadServerStatus') }}</p>
            <p class="text-sm">{{ healthErrorMessage }}</p>
          </div>
          <div v-else-if="healthData" class="health-grid">
            <!-- Overall Status -->
            <div class="health-item">
              <span class="health-label">{{ t('admin.healthPage.status') }}</span>
              <span :class="['badge', getStatusBadgeClass(healthData.status)]">
                <component :is="getStatusIcon(healthData.status)" class="icon-xs" />
                {{ getStatusLabel(healthData.status) }}
              </span>
            </div>

            <!-- Uptime -->
            <div class="health-item">
              <span class="health-label">{{ t('admin.healthPage.uptime') }}</span>
              <span class="health-value">{{ formatUptime(healthData.uptime) }}</span>
            </div>

            <!-- Node Version -->
            <div class="health-item">
              <span class="health-label">{{ t('admin.healthPage.node') }}</span>
              <span class="health-value">{{ healthData.nodeVersion }}</span>
            </div>

            <!-- Environment -->
            <div class="health-item">
              <span class="health-label">{{ t('admin.healthPage.environment') }}</span>
              <span class="badge badge-secondary">{{ healthData.environment }}</span>
            </div>

            <!-- Response Time -->
            <div class="health-item">
              <span class="health-label">{{ t('admin.healthPage.responseTime') }}</span>
              <span class="health-value">{{ healthData.responseTime }}ms</span>
            </div>

            <!-- Health Checks -->
            <div v-for="check in healthData.checks" :key="check.name" class="health-item">
              <span class="health-label">{{ getHealthCheckLabel(check.name) }}</span>
              <div class="health-check-status">
                <span :class="['badge', getStatusBadgeClass(check.status)]">
                  <component :is="getStatusIcon(check.status)" class="icon-xs" />
                  {{ getStatusLabel(check.status) }}
                </span>
                <span v-if="formatHealthCheckValue(check)" class="health-value health-value--secondary">
                  {{ formatHealthCheckValue(check) }}
                </span>
                <span v-if="getHealthCheckScopeLabel(check)" class="health-value health-value--scope">
                  {{ getHealthCheckScopeLabel(check) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Version and Build -->
      <section class="card mb-6">
        <div class="card-header health-section__header">
          <button
            type="button"
            class="health-section__toggle"
            :aria-expanded="!isHealthSectionCollapsed('release')"
            @click="toggleHealthSection('release')"
          >
            <IconChevronDown
              class="health-section__chevron"
              :class="{ 'is-collapsed': isHealthSectionCollapsed('release') }"
            />
            <span class="card-title">{{ t('admin.healthPage.releaseInfo') }}</span>
          </button>
        </div>
        <div v-if="!isHealthSectionCollapsed('release')" class="card-body">
          <div v-if="healthPending" class="loading-state">
            <p>{{ t('common.loading') }}</p>
          </div>
          <div v-else-if="healthError" class="empty-state">
            <p>{{ t('admin.healthPage.failedLoadServerStatus') }}</p>
            <p class="text-sm">{{ healthErrorMessage }}</p>
          </div>
          <div v-else-if="healthData" class="health-grid release-grid">
            <div class="health-item">
              <span class="health-label">{{ t('admin.healthPage.appVersion') }}</span>
              <span class="health-value">{{ healthData.appVersion }}</span>
            </div>

            <div class="health-item">
              <span class="health-label">{{ t('admin.healthPage.buildVersion') }}</span>
              <span class="health-value">{{ healthData.buildVersion }}</span>
            </div>

            <div class="health-item">
              <span class="health-label">{{ t('admin.healthPage.builtAt') }}</span>
              <span class="health-value">{{ formatDateTime(healthData.buildTimestamp) }}</span>
            </div>

            <div class="health-item">
              <span class="health-label">{{ t('admin.healthPage.commitSha') }}</span>
              <span class="health-value">{{ healthData.buildSha }}</span>
            </div>

            <div class="health-item">
              <span class="health-label">{{ t('admin.healthPage.commitBranch') }}</span>
              <span class="health-value">{{ healthData.buildBranch }}</span>
            </div>

            <div class="health-item">
              <span class="health-label">{{ t('admin.healthPage.commitMessage') }}</span>
              <span class="health-value">{{ healthData.buildCommitMessage }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Resource Monitoring -->
      <section class="card mb-6">
        <div class="card-header health-section__header">
          <button
            type="button"
            class="health-section__toggle"
            :aria-expanded="!isHealthSectionCollapsed('monitoring')"
            @click="toggleHealthSection('monitoring')"
          >
            <IconChevronDown
              class="health-section__chevron"
              :class="{ 'is-collapsed': isHealthSectionCollapsed('monitoring') }"
            />
            <span class="card-title">{{ t('admin.healthPage.monitoringTitle') }}</span>
          </button>
          <span v-if="monitoringData?.timestamp" class="text-sm text-secondary">
            {{ t('admin.healthPage.lastUpdated', { time: formatTime(monitoringData.timestamp) }) }}
          </span>
        </div>
        <div v-if="!isHealthSectionCollapsed('monitoring')" class="card-body">
          <div v-if="monitoringPending" class="loading-state">
            <p>{{ t('common.loading') }}</p>
          </div>
          <div v-else-if="monitoringError" class="empty-state">
            <p>{{ t('admin.healthPage.failedLoadMonitoring') }}</p>
            <p class="text-sm">{{ monitoringErrorMessage }}</p>
          </div>
          <div v-else-if="!monitoringData?.available" class="empty-state">
            <p>{{ t('admin.healthPage.monitoringUnavailable') }}</p>
            <p v-if="monitoringData?.source" class="text-sm">
              {{ t('admin.healthPage.monitoringSource', { source: monitoringData.source }) }}
            </p>
            <p v-if="monitoringData?.error" class="text-sm">{{ monitoringData.error }}</p>
          </div>
          <div v-else class="monitoring-grid">
            <article v-for="metric in monitoringMetrics" :key="metric.id" class="monitoring-card">
              <div class="monitoring-card__header">
                <span class="monitoring-card__label">{{ getMonitoringMetricLabel(metric) }}</span>
                <span :class="['badge badge-sm', getStatusBadgeClass(metric.status)]">
                  <component :is="getStatusIcon(metric.status)" class="icon-xs" />
                  {{ getStatusLabel(metric.status) }}
                </span>
              </div>
              <div :class="getMonitoringValueClass(metric)">{{ formatMonitoringValue(metric) }}</div>
              <div class="monitoring-card__meta">
                <span>{{ getMonitoringSourceLabel(metric) }}</span>
              </div>
              <div v-if="getMonitoringStatItems(metric).length > 0" class="monitoring-card__stats">
                <span v-for="stat in getMonitoringStatItems(metric)" :key="stat.key" class="monitoring-card__stat">
                  <span class="monitoring-card__stat-label">{{ stat.label }}</span>
                  <span class="monitoring-card__stat-value">{{ stat.value }}</span>
                </span>
              </div>
              <svg
                v-if="getMonitoringSparklinePoints(metric)"
                class="monitoring-card__sparkline"
                viewBox="0 0 160 54"
                role="img"
                :aria-label="getMonitoringChartLabel(metric)"
              >
                <line class="monitoring-card__grid-line" x1="0" y1="4" x2="160" y2="4" />
                <line class="monitoring-card__grid-line" x1="0" y1="27" x2="160" y2="27" />
                <line class="monitoring-card__grid-line" x1="0" y1="48" x2="160" y2="48" />
                <polyline :points="getMonitoringSparklinePoints(metric)" />
                <circle v-if="getMonitoringCurrentPoint(metric)" :cx="getMonitoringCurrentPoint(metric).split(',')[0]" :cy="getMonitoringCurrentPoint(metric).split(',')[1]" r="2.5" />
              </svg>
              <div v-if="getMonitoringTimeRange(metric)" class="monitoring-card__time">
                {{ getMonitoringTimeRange(metric) }}
              </div>
            </article>
          </div>
        </div>
      </section>

      <!-- Operations Console -->
      <section class="card mb-6">
        <div class="card-header health-section__header">
          <button
            type="button"
            class="health-section__toggle"
            :aria-expanded="!isHealthSectionCollapsed('ops')"
            @click="toggleHealthSection('ops')"
          >
            <IconChevronDown
              class="health-section__chevron"
              :class="{ 'is-collapsed': isHealthSectionCollapsed('ops') }"
            />
            <span class="card-title">{{ translateHealthLabel('admin.healthPage.opsTitle', 'Operations Console') }}</span>
          </button>
          <button class="btn btn-sm btn-outline" :disabled="opsPending" @click="refreshOps">
            <IconRefresh :class="{ spin: opsPending }" />
            {{ t('common.refresh') }}
          </button>
        </div>
        <div v-if="!isHealthSectionCollapsed('ops')" class="card-body">
          <div v-if="opsPending" class="loading-state">
            <p>{{ t('common.loading') }}</p>
          </div>
          <div v-else class="ops-console">
            <div class="ops-problems" :class="{ 'ops-problems--ok': getOpsProblems().length === 0 }">
              <h3 class="ops-console__heading">{{ translateHealthLabel('admin.healthPage.opsProblems', 'Problem Summary') }}</h3>
              <ul v-if="getOpsProblems().length > 0" class="ops-problems__list">
                <li v-for="problem in getOpsProblems()" :key="problem">{{ problem }}</li>
              </ul>
              <p v-else class="ops-problems__empty">{{ translateHealthLabel('admin.healthPage.opsNoProblems', 'No immediate operational problems detected.') }}</p>
            </div>

            <div class="ops-grid">
              <article class="ops-panel">
                <h3 class="ops-console__heading">{{ translateHealthLabel('admin.healthPage.opsContainers', 'Containers') }}</h3>
                <div v-if="opsContainers.length === 0" class="text-sm text-secondary">
                  {{ opsData?.error || translateHealthLabel('admin.healthPage.opsUnavailable', 'Ops agent unavailable') }}
                </div>
                <div v-for="container in opsContainers" :key="container.name" class="ops-row">
                  <div>
                    <div class="ops-row__title">{{ container.name }}</div>
                    <div class="ops-row__meta">{{ container.image }}</div>
                  </div>
                  <span :class="['badge badge-sm', getOpsContainerBadge(container)]">
                    {{ getOpsContainerLabel(container) }}
                  </span>
                </div>
              </article>

              <article class="ops-panel">
                <h3 class="ops-console__heading">{{ translateHealthLabel('admin.healthPage.opsDatabase', 'Database') }}</h3>
                <div class="ops-row">
                  <span>{{ translateHealthLabel('admin.healthPage.opsDbFile', 'SQLite file') }}</span>
                  <span :class="['badge badge-sm', getOpsPathBadge(opsData?.database?.file)]">
                    {{ getOpsPathStatus(opsData?.database?.file) }}
                  </span>
                </div>
                <div class="ops-row">
                  <span>{{ translateHealthLabel('admin.healthPage.opsBackups', 'Backups') }}</span>
                  <span :class="['badge badge-sm', getOpsPathBadge(opsData?.database?.backupDir)]">
                    {{ getOpsPathStatus(opsData?.database?.backupDir) }}
                  </span>
                </div>
                <div class="ops-row">
                  <span>{{ translateHealthLabel('admin.healthPage.opsMigrations', 'Migrations') }}</span>
                  <span class="ops-row__meta">
                    {{ opsData?.database?.migrations?.applied ?? '-' }}/{{ opsData?.database?.migrations?.expected ?? '-' }}
                  </span>
                </div>
              </article>

              <article class="ops-panel">
                <h3 class="ops-console__heading">{{ translateHealthLabel('admin.healthPage.opsStorage', 'Storage') }}</h3>
                <div class="ops-row">
                  <span>{{ translateHealthLabel('admin.healthPage.opsUploads', 'Uploads') }}</span>
                  <span :class="['badge badge-sm', getOpsPathBadge(opsData?.storage?.uploads)]">
                    {{ getOpsPathStatus(opsData?.storage?.uploads) }}
                  </span>
                </div>
                <div class="ops-row">
                  <span>{{ translateHealthLabel('admin.healthPage.opsTemp', 'Temp') }}</span>
                  <span :class="['badge badge-sm', getOpsPathBadge(opsData?.storage?.temp)]">
                    {{ getOpsPathStatus(opsData?.storage?.temp) }}
                  </span>
                </div>
                <div class="ops-row">
                  <span>{{ translateHealthLabel('admin.healthPage.opsDockerDisk', 'Docker disk') }}</span>
                  <span class="ops-row__meta">
                    {{ formatBytes(opsData?.dockerDisk?.imageBytes) }}
                  </span>
                </div>
              </article>
            </div>

            <div class="ops-actions">
              <h3 class="ops-console__heading">{{ translateHealthLabel('admin.healthPage.opsActions', 'Safe Actions') }}</h3>
              <button
                v-for="action in opsActions"
                :key="action.id"
                type="button"
                :class="['btn btn-sm', action.dangerous ? 'btn-outline' : 'btn-secondary']"
                :disabled="Boolean(opsActionPending) || !opsData?.available"
                @click="runOpsAction(action)"
              >
                <IconPlayerPlay :class="{ spin: opsActionPending === action.id }" />
                {{ action.label }}
              </button>
            </div>

            <div v-if="opsActionError" class="terminal-entry terminal-entry--error">
              <pre class="terminal-entry__output">{{ opsActionError }}</pre>
            </div>
            <div v-if="opsActionResult" class="terminal-entry">
              <div class="terminal-entry__command">{{ opsActionResult.action }}</div>
              <pre class="terminal-entry__output">{{ JSON.stringify(opsActionResult.result, null, 2) }}</pre>
            </div>

            <div class="ops-logs">
              <h3 class="ops-console__heading">{{ translateHealthLabel('admin.healthPage.opsLogs', 'Container Logs') }}</h3>
              <div class="ops-logs__controls">
                <div class="pm-select">
                  <button
                    type="button"
                    class="pm-select__trigger"
                    :aria-expanded="opsLogContainerMenuOpen"
                    @click.stop="opsLogContainerMenuOpen = !opsLogContainerMenuOpen"
                  >
                    <span>{{ opsLogContainerLabel }}</span>
                    <IconChevronDown class="pm-select__chevron" :class="{ 'is-open': opsLogContainerMenuOpen }" />
                  </button>
                  <div v-if="opsLogContainerMenuOpen" class="pm-select__menu">
                    <button
                      v-for="option in opsLogContainerOptions"
                      :key="option.value"
                      type="button"
                      class="pm-select__option"
                      :class="{ 'is-selected': opsLogContainer === option.value }"
                      @click="selectOpsLogContainer(option.value)"
                    >
                      {{ translateHealthLabel(option.labelKey, option.fallback) }}
                    </button>
                  </div>
                </div>
                <button class="btn btn-sm btn-outline" :disabled="opsLogsPending || !opsData?.available" @click="loadOpsLogs">
                  <IconRefresh :class="{ spin: opsLogsPending }" />
                  {{ translateHealthLabel('admin.healthPage.opsLoadLogs', 'Load Logs') }}
                </button>
              </div>
              <div v-if="opsLogsError" class="terminal-entry terminal-entry--error">
                <pre class="terminal-entry__output">{{ opsLogsError }}</pre>
              </div>
              <div v-if="opsLogs" class="terminal-entry">
                <div class="terminal-entry__command">{{ opsLogs.name }}</div>
                <pre class="terminal-entry__output">{{ opsLogs.output }}</pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Terminal -->
      <section class="card mb-6">
        <div class="card-header health-section__header">
          <button
            type="button"
            class="health-section__toggle"
            :aria-expanded="!isHealthSectionCollapsed('terminal')"
            @click="toggleHealthSection('terminal')"
          >
            <IconChevronDown
              class="health-section__chevron"
              :class="{ 'is-collapsed': isHealthSectionCollapsed('terminal') }"
            />
            <IconTerminal2 class="icon-sm" />
            <span class="card-title">{{ translateHealthLabel('admin.healthPage.terminal', 'Терминал') }}</span>
          </button>
        </div>
        <div v-if="!isHealthSectionCollapsed('terminal')" class="card-body">
          <p class="terminal-description">
            {{ t('admin.healthPage.terminalDescription') }}
          </p>
          <div class="terminal-command-list-label">
            {{ t('admin.healthPage.terminalAllowedCommands') }}
          </div>
          <div class="terminal-command-list" :aria-label="t('admin.healthPage.terminalAllowedCommands')">
            <button
              v-for="option in terminalCommandOptions"
              :key="option.command"
              type="button"
              class="terminal-command-chip"
              :title="option.command"
              :disabled="terminalPending"
              @click="terminalCommand = option.command"
            >
              {{ getTerminalCommandLabel(option) }}
            </button>
          </div>

          <form class="terminal-form" @submit.prevent="runTerminalCommand">
            <label class="sr-only" for="terminal-command">{{ t('admin.healthPage.terminalCommand') }}</label>
            <span class="terminal-prompt">$</span>
            <input
              id="terminal-command"
              v-model="terminalCommand"
              class="terminal-input"
              type="text"
              autocomplete="off"
              spellcheck="false"
              :placeholder="t('admin.healthPage.terminalCommand')"
              :disabled="terminalPending"
            />
            <button class="btn btn-sm btn-outline" type="submit" :disabled="terminalPending || !terminalCommand.trim()">
              <IconPlayerPlay :class="{ spin: terminalPending }" />
              {{ t('admin.healthPage.runCommand') }}
            </button>
          </form>

          <div class="terminal-screen" aria-live="polite">
            <div v-if="terminalError" class="terminal-entry terminal-entry--error">
              <div class="terminal-entry__command">$ {{ terminalCommand }}</div>
              <pre class="terminal-entry__output">{{ terminalError }}</pre>
            </div>
            <div v-if="terminalHistory.length === 0 && !terminalError" class="terminal-entry terminal-entry--empty">
              <pre class="terminal-entry__output">{{ t('admin.healthPage.terminalEmpty') }}</pre>
            </div>
            <div v-for="entry in terminalHistory" :key="`${entry.startedAt}-${entry.command}`" class="terminal-entry">
              <div class="terminal-entry__command">$ {{ entry.command }}</div>
              <pre class="terminal-entry__output">{{ entry.output }}</pre>
              <div class="terminal-entry__meta">
                {{ t('admin.healthPage.terminalExitCode', { code: entry.exitCode, duration: entry.durationMs }) }}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- External Monitoring -->
      <section v-if="uptimeKumaUrl" class="card mb-6">
        <div class="card-header health-section__header">
          <button
            type="button"
            class="health-section__toggle"
            :aria-expanded="!isHealthSectionCollapsed('external')"
            @click="toggleHealthSection('external')"
          >
            <IconChevronDown
              class="health-section__chevron"
              :class="{ 'is-collapsed': isHealthSectionCollapsed('external') }"
            />
            <span class="card-title">{{ t('admin.healthPage.externalMonitoring') }}</span>
          </button>
        </div>
        <div v-if="!isHealthSectionCollapsed('external')" class="card-body">
          <a :href="uptimeKumaUrl" target="_blank" rel="noopener" class="btn btn-outline">
            <IconExternalLink />
            {{ t('admin.healthPage.openUptimeKuma') }}
          </a>
        </div>
      </section>

      <!-- Recent Logs -->
      <section class="card mb-6">
        <div class="card-header health-section__header">
          <button
            type="button"
            class="health-section__toggle"
            :aria-expanded="!isHealthSectionCollapsed('logs')"
            @click="toggleHealthSection('logs')"
          >
            <IconChevronDown
              class="health-section__chevron"
              :class="{ 'is-collapsed': isHealthSectionCollapsed('logs') }"
            />
            <span class="card-title">{{ t('admin.healthPage.recentLogs') }}</span>
          </button>
          <div class="flex gap-sm align-center">
            <select v-model="logLevel" class="input input-sm">
              <option value="all">{{ t('admin.healthPage.allLevels') }}</option>
              <option value="error">{{ t('admin.healthPage.errorsOnly') }}</option>
              <option value="warn">{{ t('admin.healthPage.warningsPlus') }}</option>
              <option value="info">{{ t('admin.healthPage.infoPlus') }}</option>
            </select>
            <button class="btn btn-sm btn-ghost" :title="t('admin.healthPage.copyLogs')" @click="copyLogs">
              <IconCopy />
            </button>
          </div>
        </div>
        <div v-if="!isHealthSectionCollapsed('logs')" class="card-body log-container">
          <div v-if="logsPending" class="loading-state">
            <p>{{ t('common.loading') }}</p>
          </div>
          <div v-else-if="logsError" class="empty-state">
            <p>{{ t('admin.healthPage.failedLoadLogs') }}</p>
            <p class="text-sm">{{ logsErrorMessage }}</p>
          </div>
          <div v-else-if="logs.length === 0" class="empty-state">
            <p>{{ t('admin.healthPage.noLogs') }}</p>
            <p class="text-sm">{{ t('admin.healthPage.productionLogsOnly') }}</p>
          </div>
          <div v-else class="log-list">
            <div v-for="(log, index) in logs" :key="index" class="log-entry">
              <span class="log-time">{{ formatTime(log.time) }}</span>
              <span :class="['badge badge-sm', getLogLevelClass(log.level)]">
                {{ log.levelLabel }}
              </span>
              <span class="log-message">{{ log.msg }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Audit Trail -->
      <section class="card">
        <div class="card-header health-section__header">
          <button
            type="button"
            class="health-section__toggle"
            :aria-expanded="!isHealthSectionCollapsed('audit')"
            @click="toggleHealthSection('audit')"
          >
            <IconChevronDown
              class="health-section__chevron"
              :class="{ 'is-collapsed': isHealthSectionCollapsed('audit') }"
            />
            <span class="card-title">{{ t('admin.healthPage.auditTrail') }}</span>
          </button>
          <span class="text-sm text-secondary">
            {{ t('admin.healthPage.totalEvents', { total: auditTotal }) }}
          </span>
        </div>
        <template v-if="!isHealthSectionCollapsed('audit')">
          <div v-if="auditPending" class="card-body">
            <div class="loading-state">
              <p>{{ t('common.loading') }}</p>
            </div>
          </div>
          <div v-else-if="auditError" class="card-body">
            <div class="empty-state">
              <p>{{ t('admin.healthPage.failedLoadAuditEvents') }}</p>
              <p class="text-sm">{{ auditErrorMessage }}</p>
            </div>
          </div>
          <div v-else-if="auditLogs.length === 0" class="card-body">
            <div class="empty-state">
              <p>{{ t('admin.healthPage.noAuditEvents') }}</p>
            </div>
          </div>
          <template v-else>
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ t('admin.healthPage.time') }}</th>
                  <th>{{ t('admin.healthPage.action') }}</th>
                  <th>{{ t('admin.healthPage.user') }}</th>
                  <th>{{ t('admin.healthPage.ipAddress') }}</th>
                  <th>{{ t('admin.healthPage.status') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in auditLogs" :key="log.id">
                  <td :data-label="t('admin.healthPage.time')">{{ formatDate(log.createdAt) }}</td>
                  <td :data-label="t('admin.healthPage.action')">
                    <code>{{ log.action }}</code>
                  </td>
                  <td :data-label="t('admin.healthPage.user')">
                    {{ log.actorName || log.actorEmail || t('admin.healthPage.system') }}
                  </td>
                  <td :data-label="t('admin.healthPage.ipAddress')">
                    <code v-if="log.ipAddress">{{ log.ipAddress }}</code>
                    <span v-else class="text-secondary">-</span>
                  </td>
                  <td :data-label="t('admin.healthPage.status')">
                    <span :class="['badge', log.success ? 'badge-success' : 'badge-error']">
                      {{ log.success ? t('admin.healthPage.success') : t('admin.healthPage.failed') }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="pagination-bar">
              <span class="pagination-bar__summary">
                {{ auditPageStart }}-{{ auditPageEnd }} / {{ auditTotal }}
              </span>
              <div class="pagination-bar__actions">
                <button
                  type="button"
                  class="btn btn-sm btn-outline"
                  :disabled="!auditHasPreviousPage"
                  @click="previousAuditPage"
                >
                  {{ t('common.previous') }}
                </button>
                <span class="pagination-bar__page">{{ auditPage }} / {{ auditTotalPages }}</span>
                <button
                  type="button"
                  class="btn btn-sm btn-outline"
                  :disabled="!auditHasNextPage"
                  @click="nextAuditPage"
                >
                  {{ t('common.next') }}
                </button>
              </div>
            </div>
          </template>
        </template>
      </section>
    </div>
  </div>
</template>
