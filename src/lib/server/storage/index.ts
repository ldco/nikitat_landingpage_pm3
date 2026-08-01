/**
 * Storage Factory (PM v2 server/utils/storage/index.ts parity)
 *
 * Returns the active StorageAdapter based on STORAGE_CONFIG.provider.
 */
import type { StorageAdapter } from './types'
import { LocalStorageAdapter } from './local'

let _adapter: StorageAdapter | null = null

export function getStorageAdapter(): StorageAdapter {
  if (!_adapter) {
    // Only 'local' is implemented; 's3' requires AWS credentials.
    // Config-driven: switch here when S3 support lands.
    _adapter = new LocalStorageAdapter()
  }
  return _adapter
}

export type { StorageAdapter, UploadOptions, UploadResult } from './types'
