/**
 * Boot/Deploy Translation Sync — applies the canonical i18n catalog to the DB.
 *
 * This is the EXPLICIT catalog-sync path (the counterpart to the seed's
 * backfill-only routine seed): it runs with `forceSystemSync` so corrected
 * SYSTEM values from i18n/system-seed.json (e.g. fixed French/Hebrew strings)
 * reach the live translations table without a manual `db:seed`. CONTENT rows
 * stay editor-owned — existing values are never overwritten.
 *
 * Runs in the production container at boot (docker-entrypoint.sh, gated by
 * PM_SYNC_TRANSLATIONS_ON_BOOT) and is safe to re-run: idempotent, one
 * transaction, no bootstrap-credential gate (translations only — no user
 * seeding).
 *
 * Bundled for the runtime image by `npm run build:sync-translations`
 * (esbuild) — the production container ships the compiled bundle, not the
 * TypeScript source.
 */
import { useDatabase, closeDatabase } from '$lib/server/db'
import { seedTranslations } from '$lib/server/db/seed-data/translations'

function sync() {
  useDatabase()
  const result = seedTranslations(undefined, undefined, { forceSystemSync: true })
  console.log(
    `✅ Translation catalog sync: ${result.added} added, ${result.updated} updated, ${result.preserved} preserved`
  )
}

try {
  sync()
  closeDatabase()
} catch (error) {
  console.error(
    '[sync-translations] failed:',
    error instanceof Error ? error.message : String(error)
  )
  closeDatabase()
  process.exit(1)
}
