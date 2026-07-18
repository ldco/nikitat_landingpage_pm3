import type { H3Event } from 'h3'

export interface OpsAgentRequestOptions {
  method?: 'GET' | 'POST'
  body?: Record<string, unknown>
  query?: Record<string, string | number | boolean | undefined>
}

export function getOpsAgentConfig(event: H3Event): { enabled: boolean; url: string; token: string } {
  const runtimeConfig = useRuntimeConfig(event)
  const enabledValue = String(process.env.PM_OPS_AGENT_ENABLED ?? runtimeConfig.opsAgentEnabled ?? 'false')
    .trim()
    .toLowerCase()

  return {
    enabled: !['0', 'false', 'no', 'off'].includes(enabledValue),
    url: String(process.env.PM_OPS_AGENT_URL || runtimeConfig.opsAgentUrl || 'http://127.0.0.1:3010').replace(/\/+$/, ''),
    token: String(process.env.PM_OPS_AGENT_TOKEN || runtimeConfig.opsAgentToken || '')
  }
}

export async function opsAgentFetch<T>(
  event: H3Event,
  path: string,
  options: OpsAgentRequestOptions = {}
): Promise<T> {
  const config = getOpsAgentConfig(event)
  if (!config.enabled) {
    throw createError({
      statusCode: 503,
      message: 'Ops agent is disabled'
    })
  }

  if (!config.token) {
    throw createError({
      statusCode: 503,
      message: 'Ops agent token is not configured'
    })
  }

  const url = new URL(`${config.url}${path}`)
  for (const [key, value] of Object.entries(options.query || {})) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      authorization: `Bearer ${config.token}`,
      ...(options.body ? { 'content-type': 'application/json' } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: AbortSignal.timeout(10_000)
  })

  const payload = await response.json().catch(() => null) as { success?: boolean; data?: T; error?: string } | null
  if (!response.ok || !payload?.success) {
    throw createError({
      statusCode: response.status || 502,
      message: payload?.error || `Ops agent returned HTTP ${response.status}`
    })
  }

  return payload.data as T
}
