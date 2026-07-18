import type { H3Event } from 'h3'

export interface NetdataSeriesPoint {
  timestamp: number
  value: number
}

export interface NetdataMetric {
  id: string
  label: string
  unit: string
  value: number | null
  status: 'ok' | 'warning' | 'error' | 'unavailable'
  chart: string
  dimensions: string[]
  points: NetdataSeriesPoint[]
  detail?: string
}

export interface NetdataSummary {
  available: boolean
  source: string
  timestamp: string
  metrics: NetdataMetric[]
  error?: string
}

interface NetdataCsvQuery {
  chart: string
  dimensionNames: string[]
  rows: Array<Record<string, number>>
}

interface NetdataJsonWrapResponse {
  id?: string
  name?: string
  dimension_names?: string[]
  result?: string
}

interface NetdataChartInfo {
  id?: string
  name?: string
  context?: string
  family?: string
}

interface NetdataChartsResponse {
  charts?: Record<string, NetdataChartInfo>
}

interface MetricDefinition {
  id: string
  label: string
  unit: string
  charts: string[]
  chartMatcher?: (chart: NetdataChartInfo & { id: string }) => boolean
  value: (query: NetdataCsvQuery) => number | null
  status?: (value: number | null) => NetdataMetric['status']
  detail?: (query: NetdataCsvQuery, value: number | null) => string | undefined
}

const NETDATA_DEFAULT_URL = 'http://127.0.0.1:19999'
const DEFAULT_AFTER_SECONDS = 300
const DEFAULT_POINTS = 30

const metricDefinitions: MetricDefinition[] = [
  {
    id: 'cpu',
    label: 'CPU',
    unit: '%',
    charts: ['system.cpu'],
    value: query => latestSum(query, name => name !== 'idle'),
    status: percentageStatus
  },
  {
    id: 'ram',
    label: 'RAM',
    unit: '%',
    charts: ['system.ram'],
    value: query => {
      const latest = latestRow(query)
      if (!latest) return null
      const total = sumDimensions(latest, () => true)
      const used = getDimension(latest, ['used'])
      if (total <= 0 || used === null) return null
      return (used / total) * 100
    },
    status: percentageStatus,
    detail: query => {
      const latest = latestRow(query)
      if (!latest) return undefined
      const total = sumDimensions(latest, () => true)
      const used = getDimension(latest, ['used'])
      if (total <= 0 || used === null) return undefined
      return `${Math.round(used)}/${Math.round(total)} MB`
    }
  },
  {
    id: 'load',
    label: 'Load',
    unit: '',
    charts: ['system.load'],
    value: query => latestDimension(query, ['load1', 'load 1', '1min']),
    status: value => {
      if (value === null) return 'unavailable'
      if (value >= 4) return 'error'
      if (value >= 2) return 'warning'
      return 'ok'
    }
  },
  {
    id: 'disk',
    label: 'Disk',
    unit: '%',
    charts: ['disk_space._', 'disk_space./', 'disk_space.root'],
    chartMatcher: chart => {
      const id = chart.id || chart.name || ''
      return id.startsWith('disk_space.') || chart.context === 'disk.space'
    },
    value: query => {
      const latest = latestRow(query)
      if (!latest) return null
      const used = getDimension(latest, ['used'])
      const avail = getDimension(latest, ['avail', 'available', 'free'])
      if (used === null || avail === null || used + avail <= 0) return null
      return (used / (used + avail)) * 100
    },
    status: percentageStatus
  },
  {
    id: 'network',
    label: 'Network',
    unit: 'Kbit/s',
    charts: ['system.net'],
    value: query => latestAbsSum(query),
    status: value => value === null ? 'unavailable' : 'ok'
  },
  {
    id: 'diskIo',
    label: 'Disk I/O',
    unit: 'KiB/s',
    charts: ['system.io'],
    value: query => latestAbsSum(query),
    status: value => value === null ? 'unavailable' : 'ok'
  }
]

export function getNetdataConfig(event: H3Event): { enabled: boolean; url: string } {
  const runtimeConfig = useRuntimeConfig(event)
  const enabledValue = String(runtimeConfig.netdataEnabled ?? process.env.PM_MONITORING_NETDATA_ENABLED ?? 'true')
    .trim()
    .toLowerCase()

  return {
    enabled: !['0', 'false', 'no', 'off'].includes(enabledValue),
    url: String(process.env.NETDATA_URL || runtimeConfig.netdataUrl || NETDATA_DEFAULT_URL).replace(/\/+$/, '')
  }
}

export async function getNetdataSummary(event: H3Event): Promise<NetdataSummary> {
  const config = getNetdataConfig(event)
  if (!config.enabled) {
    return {
      available: false,
      source: config.url,
      timestamp: new Date().toISOString(),
      metrics: [],
      error: 'Netdata monitoring is disabled'
    }
  }

  try {
    const metrics = await Promise.all(metricDefinitions.map(definition => buildMetric(config.url, definition)))
    return {
      available: metrics.some(metric => metric.status !== 'unavailable'),
      source: config.url,
      timestamp: new Date().toISOString(),
      metrics
    }
  } catch (error: unknown) {
    return {
      available: false,
      source: config.url,
      timestamp: new Date().toISOString(),
      metrics: [],
      error: error instanceof Error ? error.message : 'Netdata request failed'
    }
  }
}

export async function getNetdataTimeseries(
  event: H3Event,
  metricId: string,
  afterSeconds = DEFAULT_AFTER_SECONDS,
  points = DEFAULT_POINTS
): Promise<NetdataMetric | null> {
  const config = getNetdataConfig(event)
  if (!config.enabled) return null

  const definition = metricDefinitions.find(metric => metric.id === metricId)
  if (!definition) return null

  return buildMetric(config.url, definition, afterSeconds, points)
}

async function buildMetric(
  netdataUrl: string,
  definition: MetricDefinition,
  afterSeconds = DEFAULT_AFTER_SECONDS,
  points = DEFAULT_POINTS
): Promise<NetdataMetric> {
  const query = await queryFirstAvailable(netdataUrl, definition, afterSeconds, points)
  if (!query) {
    return {
      id: definition.id,
      label: definition.label,
      unit: definition.unit,
      value: null,
      status: 'unavailable',
      chart: definition.charts[0] || definition.id,
      dimensions: [],
      points: []
    }
  }

  const value = definition.value(query)
  return {
    id: definition.id,
    label: definition.label,
    unit: definition.unit,
    value,
    status: definition.status?.(value) ?? 'ok',
    chart: query.chart,
    dimensions: query.dimensionNames,
    points: query.rows.map(row => ({
      timestamp: row.time || 0,
      value: definition.value({ ...query, rows: [row] }) ?? 0
    })),
    detail: definition.detail?.(query, value)
  }
}

async function queryFirstAvailable(
  netdataUrl: string,
  definition: MetricDefinition,
  afterSeconds: number,
  points: number
): Promise<NetdataCsvQuery | null> {
  const charts = [...definition.charts]
  if (definition.chartMatcher) {
    charts.push(...await discoverMatchingCharts(netdataUrl, definition.chartMatcher))
  }

  for (const chart of [...new Set(charts)]) {
    try {
      const query = await queryChart(netdataUrl, chart, afterSeconds, points)
      if (query.rows.length > 0) {
        return query
      }
    } catch {
      // Try the next chart alias. Netdata chart IDs can vary for mount points.
    }
  }
  return null
}

async function discoverMatchingCharts(
  netdataUrl: string,
  matcher: NonNullable<MetricDefinition['chartMatcher']>
): Promise<string[]> {
  try {
    const response = await fetch(`${netdataUrl}/api/v1/charts`, {
      signal: AbortSignal.timeout(2500)
    })

    if (!response.ok) return []

    const payload = await response.json() as NetdataChartsResponse
    const charts = Object.entries(payload.charts || {})
      .map(([id, chart]) => ({ ...chart, id: chart.id || id }))
      .filter(matcher)
      .sort((left, right) => chartPriority(left.id) - chartPriority(right.id))

    return charts.map(chart => chart.id)
  } catch {
    return []
  }
}

function chartPriority(chartId: string): number {
  if (chartId === 'disk_space._' || chartId === 'disk_space./' || chartId === 'disk_space.root') return 0
  if (chartId.includes('root')) return 1
  return 2
}

async function queryChart(
  netdataUrl: string,
  chart: string,
  afterSeconds: number,
  points: number
): Promise<NetdataCsvQuery> {
  const params = new URLSearchParams({
    chart,
    after: `-${afterSeconds}`,
    points: String(points),
    group: 'average',
    format: 'csv',
    options: 'jsonwrap,seconds,nonzero'
  })

  const response = await fetch(`${netdataUrl}/api/v1/data?${params.toString()}`, {
    signal: AbortSignal.timeout(2500)
  })

  if (!response.ok) {
    throw new Error(`Netdata returned HTTP ${response.status} for ${chart}`)
  }

  const payload = await response.json() as NetdataJsonWrapResponse
  return parseCsvResult(chart, payload)
}

function parseCsvResult(chart: string, payload: NetdataJsonWrapResponse): NetdataCsvQuery {
  const result = payload.result?.trim()
  if (!result) {
    return {
      chart: payload.id || payload.name || chart,
      dimensionNames: payload.dimension_names || [],
      rows: []
    }
  }

  const lines = result.split(/\r?\n/).filter(Boolean)
  const header = lines.shift()?.split(',') || []
  const dimensionNames = header.slice(1)

  const rows = lines.map(line => {
    const values = line.split(',')
    const row: Record<string, number> = {
      time: Number(values[0] || 0)
    }

    for (let index = 1; index < header.length; index += 1) {
      const colName = header[index]
      if (colName !== undefined) {
        row[colName] = Number(values[index] || 0)
      }
    }

    return row
  })

  return {
    chart: payload.id || payload.name || chart,
    dimensionNames,
    rows
  }
}

function latestRow(query: NetdataCsvQuery): Record<string, number> | null {
  return query.rows[query.rows.length - 1] || null
}

function latestDimension(query: NetdataCsvQuery, candidates: string[]): number | null {
  const latest = latestRow(query)
  if (!latest) return null
  return getDimension(latest, candidates)
}

function latestSum(query: NetdataCsvQuery, include: (dimension: string) => boolean): number | null {
  const latest = latestRow(query)
  if (!latest) return null
  return sumDimensions(latest, include)
}

function latestAbsSum(query: NetdataCsvQuery): number | null {
  const latest = latestRow(query)
  if (!latest) return null
  return sumDimensions(latest, () => true, true)
}

function getDimension(row: Record<string, number>, candidates: string[]): number | null {
  for (const candidate of candidates) {
    if (typeof row[candidate] === 'number' && Number.isFinite(row[candidate])) {
      return row[candidate]
    }
  }
  return null
}

function sumDimensions(
  row: Record<string, number>,
  include: (dimension: string) => boolean,
  absolute = false
): number {
  return Object.entries(row).reduce((sum, [dimension, value]) => {
    if (dimension === 'time' || !include(dimension) || !Number.isFinite(value)) return sum
    return sum + (absolute ? Math.abs(value) : value)
  }, 0)
}

function percentageStatus(value: number | null): NetdataMetric['status'] {
  if (value === null) return 'unavailable'
  if (value >= 95) return 'error'
  if (value >= 85) return 'warning'
  return 'ok'
}
