/**
 * Storage Factory — returns the active StorageAdapter from STORAGE_CONFIG.
 *
 *   STORAGE_CONFIG.provider = 'local' (default)  -> LocalStorageAdapter
 *   STORAGE_CONFIG.provider = 's3'               -> S3StorageAdapter (env-configured)
 *
 * The adapter is created lazily on first use; the S3 factory fails loudly when
 * its env configuration is incomplete (same fail-loud contract as env.ts).
 */
import { STORAGE_CONFIG } from '$lib/config/site'
import type { StorageAdapter } from './types'
import { LocalStorageAdapter } from './local'
import { createS3StorageAdapter } from './s3'

let _adapter: StorageAdapter | null = null

export function getStorageAdapter(): StorageAdapter {
  if (!_adapter) {
    _adapter =
      STORAGE_CONFIG.provider === 's3' ? createS3StorageAdapter() : new LocalStorageAdapter()
  }
  return _adapter
}

/** Test hook: drop the cached adapter so a config change is honored. */
export function resetStorageAdapter(): void {
  _adapter = null
}

export type { StorageAdapter, UploadOptions, UploadResult } from './types'
export { S3StorageAdapter, createS3StorageAdapter } from './s3'
export { LocalStorageAdapter, sanitizeExt } from './local'
