import { createError } from 'h3'

type ApiErrorDetails = Record<string, unknown>

export function createApiError(
  statusCode: number,
  code: string,
  details: ApiErrorDetails = {}
) {
  return createError({
    statusCode,
    message: 'Request failed',
    data: {
      code,
      ...details
    }
  })
}
