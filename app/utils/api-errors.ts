type TranslateFn = (key: string, params?: Record<string, unknown>) => string

export function getApiErrorCode(error: unknown): string | undefined {
  const err = error as {
    data?: { code?: string; data?: { code?: string } }
    response?: { _data?: { code?: string; data?: { code?: string } } }
  }

  return err?.data?.code ||
    err?.data?.data?.code ||
    err?.response?._data?.code ||
    err?.response?._data?.data?.code
}

export function translateApiError(
  t: TranslateFn,
  error: unknown,
  fallbackKey = 'apiErrors.generic'
): string {
  const code = getApiErrorCode(error)
  return t(code ? `apiErrors.${code}` : fallbackKey)
}
