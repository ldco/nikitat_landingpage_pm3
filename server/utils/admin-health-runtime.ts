import { dirname } from 'node:path'

export function getDatabaseDiskPathFromUrl(databaseUrl: string): string | null {
  const databasePath = databaseUrl.startsWith('file:')
    ? databaseUrl.replace(/^file:/, '')
    : databaseUrl

  return databasePath.startsWith('/') ? dirname(databasePath) : null
}
