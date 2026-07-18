export interface ApiSuccessEnvelope<T> {
  success: true
  data: T
}

type FetchInput = Parameters<typeof $fetch>[0]
type FetchOptions = Parameters<typeof $fetch>[1]

export function isMutationMethod(method?: string): boolean {
  if (!method) return false
  const normalized = method.toUpperCase()
  return normalized === 'POST' || normalized === 'PUT' || normalized === 'PATCH' || normalized === 'DELETE'
}

function normalizeHeaders(headers: unknown): Record<string, string> {
  if (!headers || typeof headers !== 'object' || Array.isArray(headers)) {
    return {}
  }

  return { ...(headers as Record<string, string>) }
}

function isServerRuntime(): boolean {
  return import.meta.server && typeof window === 'undefined'
}

export const apiFetchRuntime = {
  isServerRuntime,
  useCsrf: () => useCsrf(),
  useRequestFetch: () => useRequestFetch(),
  useRoute: () => useRoute(),
  useState: <T>(key: string, init?: () => T) => useState<T>(key, init),
  navigateTo: (...args: Parameters<typeof navigateTo>) => navigateTo(...args)
}

function withCsrfHeaders(method: string | undefined, options: FetchOptions | undefined): FetchOptions {
  if (apiFetchRuntime.isServerRuntime() || !isMutationMethod(method)) {
    return options || {}
  }

  const { getToken, getHeaderName } = apiFetchRuntime.useCsrf()
  const token = getToken()
  if (!token) {
    return options || {}
  }

  const headers = normalizeHeaders(options?.headers)
  headers[getHeaderName()] = token

  return {
    ...(options || {}),
    headers
  }
}

function getApiFetchTransport() {
  if (apiFetchRuntime.isServerRuntime()) {
    try {
      return apiFetchRuntime.useRequestFetch()
    } catch {
      return $fetch
    }
  }

  return $fetch
}

export function getFetchPath(input: FetchInput): string {
  if (typeof input === 'string') {
    return input
  }

  if (input instanceof URL) {
    return input.pathname
  }

  if (input instanceof Request) {
    try {
      return new URL(input.url).pathname
    } catch {
      return input.url
    }
  }

  return ''
}

async function handleUnauthorizedApiResponse(input: FetchInput): Promise<void> {
  if (apiFetchRuntime.isServerRuntime()) {
    return
  }

  const path = getFetchPath(input)
  if (!path.startsWith('/api/admin/')) {
    return
  }

  const user = apiFetchRuntime.useState('auth-user', () => null)
  const permissions = apiFetchRuntime.useState('auth-permissions', () => ({}))
  const { clearToken } = apiFetchRuntime.useCsrf()

  user.value = null
  permissions.value = {}
  clearToken()

  const route = apiFetchRuntime.useRoute()
  if (route.path !== '/admin/login') {
    await apiFetchRuntime.navigateTo('/admin/login', { replace: true })
  }
}

export function isApiSuccessEnvelope<T>(value: unknown): value is ApiSuccessEnvelope<T> {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as { success?: unknown; data?: unknown }
  return candidate.success === true && 'data' in candidate
}

export function unwrapApiEnvelope<T>(value: ApiSuccessEnvelope<T> | T): T {
  if (isApiSuccessEnvelope<T>(value)) {
    return value.data
  }
  return value as T
}

export async function apiFetch<T>(input: FetchInput, options?: FetchOptions): Promise<T> {
  const method = typeof options?.method === 'string' ? options.method : undefined
  const transport = getApiFetchTransport()

  try {
    const response = await transport<ApiSuccessEnvelope<T> | T>(input, withCsrfHeaders(method, options))
    return unwrapApiEnvelope<T>(response as ApiSuccessEnvelope<T> | T)
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number; status?: number })?.statusCode
      ?? (error as { response?: { status?: number } })?.response?.status
      ?? (error as { data?: { statusCode?: number } })?.data?.statusCode

    if (statusCode === 401) {
      await handleUnauthorizedApiResponse(input)
    }

    throw error
  }
}
