/**
 * Features Seed — starter feature items with 4-locale translations.
 *
 * Only runs when the features table is empty. Each feature gets a base row
 * plus one translation row per locale.
 */
import { useDatabase, schema } from '$lib/server/db'

const FEATURE_SEED: Array<{
  slug: string
  category: string
  order: number
  translations: Record<string, { title: string; description: string }>
}> = [
  {
    slug: 'config-driven',
    category: 'framework',
    order: 1,
    translations: {
      ru: {
        title: 'Конфиг-управляемая структура',
        description: 'Тип проекта, секции, модули, локали и админ-панель управляются из конфигурации PM.'
      },
      en: {
        title: 'Config-driven structure',
        description: 'Project type, sections, modules, locales, and admin surfaces are controlled from PM configuration.'
      },
      fr: {
        title: 'Structure pilotée par configuration',
        description: 'Le type de projet, les sections, les modules, les locales et l\'admin sont contrôlés par la configuration PM.'
      },
      he: {
        title: 'מבנה מונע קונפיגורציה',
        description: 'סוג הפרויקט, הקטעים, המודולים, האזורים ומסכי הניהול נשלטים מקונפיגורציית PM.'
      }
    }
  },
  {
    slug: 'typed-content',
    category: 'framework',
    order: 2,
    translations: {
      ru: {
        title: 'Типизированный контент',
        description: 'SvelteKit, Drizzle и Zod обеспечивают валидированный путь от админ-контента к публичным страницам.'
      },
      en: {
        title: 'Typed content workflow',
        description: 'SvelteKit, Drizzle, and Zod provide a validated path from admin content to public pages.'
      },
      fr: {
        title: 'Workflow de contenu typé',
        description: 'SvelteKit, Drizzle et Zod offrent un chemin validé du contenu admin aux pages publiques.'
      },
      he: {
        title: 'עבודה עם תוכן מוקלד',
        description: 'SvelteKit, Drizzle ו-Zod מספקים מסלול מאומת מתוכן ניהול לעמודים ציבוריים.'
      }
    }
  },
  {
    slug: 'agent-ready',
    category: 'greenfield',
    order: 3,
    translations: {
      ru: {
        title: 'Готовность к агентам',
        description: 'Концепт-доки и дефолты встроены для Codex, Claude или Qwen до начала генерации проекта.'
      },
      en: {
        title: 'Agent-ready greenfield intake',
        description: 'Concept docs and defaults are bundled for Codex, Claude, or Qwen before project generation starts.'
      },
      fr: {
        title: 'Entrée greenfield prête pour les agents',
        description: 'Les docs conceptuels et les valeurs par défaut sont inclus pour Codex, Claude ou Qwen avant le démarrage de la génération.'
      },
      he: {
        title: 'קליטת פרויקט חדש מוכנה לסוכנים',
        description: 'מסמכי קונספט וברירות מחדל ארוזים עבור Codex, Claude או Qwen לפני תחילת יצירת הפרויקט.'
      }
    }
  }
]

/**
 * FAQ seed data (mirrors PM v2 server/database/seed.ts faqSeedData).
 * Stored in `faq_items` table with translations in `faq_item_translations`.
 */

export function seedFeatures() {
  const db = useDatabase()
  console.log('✨ Feature items...')
  const existing = db.select().from(schema.features).all()
  if (existing.length > 0) {
    console.log(`   ${existing.length} feature items exist, skipping.`)
    console.log('')
    return
  }

  for (const item of FEATURE_SEED) {
    const inserted = db.insert(schema.features).values({
      slug: item.slug,
      category: item.category,
      published: true,
      order: item.order
    }).returning().get()

    for (const [locale, tr] of Object.entries(item.translations)) {
      db.insert(schema.featureTranslations).values({
        featureId: inserted.id,
        locale,
        title: tr.title,
        description: tr.description
      }).run()
    }
    console.log(`   ✓ ${item.slug}`)
  }
  console.log('')
}
