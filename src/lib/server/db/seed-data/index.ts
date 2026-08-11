/**
 * Seed Data Orchestrator — runs all entity seed modules.
 *
 * Each module is idempotent: it checks whether its table already has data
 * and skips when non-empty. Adding a new entity's seed = create a module
 * here and register it in seedAll().
 */
import { seedUsers } from './users'
import { seedRoles } from './roles'
import { seedSettings } from './settings'
import { seedTranslations } from './translations'
import { seedLegalDocuments } from './legal'
import { seedFeatures } from './features'
import { seedFaq } from './faq'

export function seedAll() {
  seedUsers()
  seedRoles()
  seedSettings()
  seedTranslations()
  seedLegalDocuments()
  seedFeatures()
  seedFaq()
}
