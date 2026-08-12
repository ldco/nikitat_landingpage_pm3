<script lang="ts">
  /**
   * Admin Health Dashboard — PM2 health page (admin-guide §System Health)
   *
   * Sections (labels sourced from admin.healthPage.* i18n keys):
   *   systemStatus   — current health checks with per-check states
   *   releaseInfo    — version/build metadata + node/env/ip
   *   recentLogs     — in-memory ring buffer tail
   *   auditTrail     — audit summary (total/success/failed + recent events)
   *   ops            — operations console (ops agent summary, master only)
   *   monitoring     — external monitoring link (Uptime Kuma)
   *
   * All labels resolve through getAdminT() → unified t() catalog; no raw
   * English fallback literals (i18n validator, rule: no untranslated regressions).
   */
  import { page } from '$app/stores'
  import { getAdminT } from '$lib/utils/admin-translations'
  import PageHeader from '$lib/components/atoms/PageHeader.svelte'
  import Badge from '$lib/components/atoms/Badge.svelte'
  import AdminFormSection from '$lib/components/molecules/AdminFormSection.svelte'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
  const report = $derived(data.report)
  const recentLogs = $derived(data.recentLogs ?? [])
  const ops = $derived(data.ops)
  const monitoring = $derived(data.monitoring)
  const t = $derived(getAdminT($page.data))

  const statusLabel = $derived.by(() => {
    const map: Record<string, string> = {
      ok: t['admin.healthPage.status.ok'] ?? '',
      degraded: t['admin.healthPage.status.degraded'] ?? '',
      error: t['admin.healthPage.status.unhealthy'] ?? ''
    }
    return map[report.status] ?? ''
  })

  const statusBadge = $derived.by(() => {
    if (report.status === 'ok') return 'success' as const
    if (report.status === 'degraded') return 'warning' as const
    return 'error' as const
  })

  function checkLabel(id: string): string {
    return t[`admin.healthPage.check.${id}`] ?? ''
  }

  function levelLabel(level: number): string {
    if (level >= 50) return 'error'
    if (level >= 40) return 'warn'
    return 'info'
  }

  function levelBadge(level: string): 'error' | 'warning' | 'success' {
    if (level === 'error') return 'error'
    if (level === 'warn') return 'warning'
    return 'success'
  }

  function fmtUptime(seconds: number): string {
    const d = Math.floor(seconds / 86400)
    const h = Math.floor((seconds % 86400) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${d}d ${h}h ${m}m`
  }
</script>

<div class="mx-auto w-full max-w-[var(--max-w-content)]">
  <PageHeader title={t['admin.health'] ?? ''} subtitle={report.timestamp ? t['admin.healthPage.lastUpdated']?.replace('{time}', new Date(report.timestamp).toLocaleString()) ?? '' : ''} />

  <div class="mt-6 flex flex-col gap-6">
    <!-- ═══ Current Health (systemStatus) ═══ -->
    <AdminFormSection title={t['admin.healthPage.systemStatus'] ?? ''}>
      <div class="flex items-center gap-3 mb-4">
        <Badge variant={statusBadge}>{statusLabel}</Badge>
        <span class="text-sm text-pm-text-muted">
          {t['admin.healthPage.uptime'] ?? ''}: {fmtUptime(report.uptime ?? 0)}
        </span>
      </div>
      <div class="grid gap-3 sm:grid-cols-2">
        {#each report.checks ?? [] as check (check.id)}
          <div class="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-pm-border bg-pm-bg">
            <div class="flex flex-col gap-0.5 min-w-0">
              <span class="text-sm font-medium text-pm-text truncate">{checkLabel(check.id)}</span>
              {#if check.value}
                <span class="text-xs text-pm-text-muted truncate">{check.value}</span>
              {/if}
              {#if check.error}
                <span class="text-xs text-pm-danger truncate">{check.error}</span>
              {/if}
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              {#if check.latencyMs !== undefined}
                <span class="text-xs text-pm-text-muted">{check.latencyMs}ms</span>
              {/if}
              <Badge variant={check.status === 'ok' ? 'success' : check.status === 'degraded' ? 'warning' : 'error'}>
                {t[`admin.healthPage.status.${check.status}`] ?? ''}
              </Badge>
            </div>
          </div>
        {/each}
      </div>
    </AdminFormSection>

    <!-- ═══ Version & Build (releaseInfo) ═══ -->
    <AdminFormSection title={t['admin.healthPage.releaseInfo'] ?? ''}>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div class="flex flex-col gap-0.5">
          <span class="text-xs text-pm-text-muted">{t['admin.healthPage.appVersion'] ?? ''}</span>
          <span class="text-sm font-medium text-pm-text">{report.build?.version ?? ''}</span>
        </div>
        <div class="flex flex-col gap-0.5">
          <span class="text-xs text-pm-text-muted">{t['admin.healthPage.buildVersion'] ?? ''}</span>
          <span class="text-sm font-medium text-pm-text">{report.build?.sha ? report.build.sha.slice(0, 8) : ''}</span>
        </div>
        <div class="flex flex-col gap-0.5">
          <span class="text-xs text-pm-text-muted">{t['admin.healthPage.builtAt'] ?? ''}</span>
          <span class="text-sm font-medium text-pm-text">{report.build?.timestamp ? new Date(report.build.timestamp).toLocaleString() : ''}</span>
        </div>
        <div class="flex flex-col gap-0.5">
          <span class="text-xs text-pm-text-muted">{t['admin.healthPage.node'] ?? ''}</span>
          <span class="text-sm font-medium text-pm-text">{report.build?.node ?? ''}</span>
        </div>
        <div class="flex flex-col gap-0.5">
          <span class="text-xs text-pm-text-muted">{t['admin.healthPage.environment'] ?? ''}</span>
          <span class="text-sm font-medium text-pm-text">{report.build?.environment ?? ''}</span>
        </div>
        <div class="flex flex-col gap-0.5">
          <span class="text-xs text-pm-text-muted">{t['admin.healthPage.ipAddress'] ?? ''}</span>
          <span class="text-sm font-medium text-pm-text">{report.build?.ip ?? ''}</span>
        </div>
      </div>
    </AdminFormSection>

    <!-- ═══ Recent Logs (recentLogs) ═══ -->
    <AdminFormSection title={t['admin.healthPage.recentLogs'] ?? ''}>
      {#if (recentLogs ?? []).length === 0}
        <p class="text-sm text-pm-text-muted">{t['admin.healthPage.noLogs'] ?? ''}</p>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-sm">
            <thead class="bg-pm-bg-sunken">
              <tr>
                <th class="px-4 py-2 text-start font-medium text-pm-text-muted text-xs uppercase tracking-wide">{t['admin.healthPage.time'] ?? ''}</th>
                <th class="px-4 py-2 text-start font-medium text-pm-text-muted text-xs uppercase tracking-wide">{t['admin.healthPage.status'] ?? ''}</th>
                <th class="px-4 py-2 text-start font-medium text-pm-text-muted text-xs uppercase tracking-wide">{t['common.message'] ?? ''}</th>
              </tr>
            </thead>
            <tbody>
              {#each recentLogs as entry, i (i)}
                <tr class="border-b border-pm-border last:border-b-0">
                  <td class="px-4 py-2 whitespace-nowrap text-xs text-pm-text-muted font-mono">{new Date(entry.time).toLocaleTimeString()}</td>
                  <td class="px-4 py-2"><Badge variant={levelBadge(levelLabel(entry.level))}>{levelLabel(entry.level)}</Badge></td>
                  <td class="px-4 py-2 text-pm-text font-mono text-xs break-words">{entry.msg}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </AdminFormSection>

    <!-- ═══ Audit Trail (auditTrail) ═══ -->
    <AdminFormSection title={t['admin.healthPage.auditTrail'] ?? ''}>
      <div class="flex gap-6 mb-4">
        <div class="flex flex-col gap-0.5">
          <span class="text-2xl font-bold text-pm-text">{report.audit?.total ?? 0}</span>
          <span class="text-xs text-pm-text-muted">{t['admin.healthPage.totalEvents']?.replace('{total}', String(report.audit?.total ?? 0)) ?? ''}</span>
        </div>
        <div class="flex flex-col gap-0.5">
          <span class="text-2xl font-bold text-pm-success">{report.audit?.success ?? 0}</span>
          <span class="text-xs text-pm-text-muted">{t['admin.healthPage.success'] ?? ''}</span>
        </div>
        <div class="flex flex-col gap-0.5">
          <span class="text-2xl font-bold text-pm-danger">{report.audit?.failed ?? 0}</span>
          <span class="text-xs text-pm-text-muted">{t['admin.healthPage.failed'] ?? ''}</span>
        </div>
      </div>
      {#if (report.audit?.recent ?? []).length > 0}
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-sm">
            <thead class="bg-pm-bg-sunken">
              <tr>
                <th class="px-4 py-2 text-start font-medium text-pm-text-muted text-xs uppercase tracking-wide">{t['admin.healthPage.action'] ?? ''}</th>
                <th class="px-4 py-2 text-start font-medium text-pm-text-muted text-xs uppercase tracking-wide">{t['admin.healthPage.time'] ?? ''}</th>
                <th class="px-4 py-2 text-start font-medium text-pm-text-muted text-xs uppercase tracking-wide">{t['admin.healthPage.status'] ?? ''}</th>
              </tr>
            </thead>
            <tbody>
              {#each report.audit.recent as ev, i (i)}
                <tr class="border-b border-pm-border last:border-b-0">
                  <td class="px-4 py-2 text-pm-text">{ev.action}</td>
                  <td class="px-4 py-2 text-xs text-pm-text-muted whitespace-nowrap">{new Date(ev.createdAt).toLocaleString()}</td>
                  <td class="px-4 py-2">
                    <Badge variant={ev.success ? 'success' : 'error'}>{ev.success ? t['admin.healthPage.status.ok'] ?? '' : t['admin.healthPage.status.error'] ?? ''}</Badge>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <p class="text-sm text-pm-text-muted">{t['admin.healthPage.noAuditEvents'] ?? ''}</p>
      {/if}
    </AdminFormSection>

    <!-- ═══ Operations Console (ops) ═══ -->
    <AdminFormSection title={t['admin.healthPage.opsTitle'] ?? ''}>
      {#if ops.available}
        <p class="text-sm text-pm-text-muted mb-3">{t['admin.healthPage.opsNoProblems'] ?? ''}</p>
        <pre class="text-xs font-mono text-pm-text bg-pm-bg rounded-lg p-4 overflow-x-auto max-h-64">{JSON.stringify(ops.summary, null, 2)}</pre>
      {:else}
        <p class="text-sm text-pm-text-muted">
          {t['admin.healthPage.opsUnavailable'] ?? ''}
          {#if ops.error}<span class="text-pm-danger"> — {ops.error}</span>{/if}
        </p>
      {/if}
    </AdminFormSection>

    <!-- ═══ External Monitoring (monitoring) ═══ -->
    <AdminFormSection title={t['admin.healthPage.externalMonitoring'] ?? ''}>
      {#if monitoring.uptimeKumaUrl}
        <a href={monitoring.uptimeKumaUrl} target="_blank" rel="noopener noreferrer"
          class="inline-flex items-center gap-2 text-sm font-medium text-pm-brand hover:text-pm-brand-light transition-colors">
          {t['admin.healthPage.openUptimeKuma'] ?? ''}
        </a>
      {:else}
        <p class="text-sm text-pm-text-muted">{t['admin.healthPage.monitoringUnavailable'] ?? ''}</p>
      {/if}
    </AdminFormSection>
  </div>
</div>
