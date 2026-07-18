/**
 * Seed translated content for all portfolio items.
 * Generates content with translated headings + Russian text.
 * Run with: npx tsx server/database/seed-content-translations.ts
 */
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { eq } from 'drizzle-orm'
import * as schema from './schema'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const DB_PATH = process.env.DATABASE_URL || './data/sqlite.db'
const JSON_PATH = join(process.cwd(), 'portfolio-parsed.json')

// Translation keys for headings
const headingMap: Record<string, Record<string, string>> = {
  'задача': { en: 'Task', fr: 'Mission', he: 'משימה' },
  'концепция': { en: 'Concept', fr: 'Concept', he: 'קונספט' },
  'результат': { en: 'Result', fr: 'Résultat', he: 'תוצאה' },
  'итог': { en: 'Summary', fr: 'Résumé', he: 'סיכום' },
  'решение': { en: 'Solution', fr: 'Solution', he: 'פתרון' },
  'реализация': { en: 'Implementation', fr: 'Mise en œuvre', he: 'יישום' },
  'айдентика': { en: 'Identity', fr: 'Identité', he: 'זהות' },
  'логотип': { en: 'Logo', fr: 'Logo', he: 'לוגו' },
  'типографика': { en: 'Typography', fr: 'Typographie', he: 'טיפוגרפיה' },
  'типографика и цвет': { en: 'Typography & Color', fr: 'Typographie et couleur', he: 'טיפוגרפיה וצבע' },
  'цветовая палитра': { en: 'Color Palette', fr: 'Palette de couleurs', he: 'פלטת צבעים' },
  'цветовая гамма': { en: 'Color Scheme', fr: 'Nuancier', he: 'ערכת צבעים' },
  'цветовая стратегия': { en: 'Color Strategy', fr: 'Stratégie couleur', he: 'אסטרטגיית צבע' },
  'палитра': { en: 'Palette', fr: 'Palette', he: 'פלטה' },
  'колористика': { en: 'Color Design', fr: 'Coloris', he: 'צבעוניות' },
  'дизайн-решения': { en: 'Design Solutions', fr: 'Solutions de design', he: 'פתרונות עיצוב' },
  'визуальные решения': { en: 'Visual Solutions', fr: 'Solutions visuelles', he: 'פתרונות ויזואליים' },
  'визуальный код': { en: 'Visual Code', fr: 'Code visuel', he: 'קוד ויזואלי' },
  'концепция и нейминг': { en: 'Concept & Naming', fr: 'Concept et naming', he: 'קונספט ושמות' },
  'позиционирование': { en: 'Positioning', fr: 'Positionnement', he: 'מיצוב' },
  'стратегия': { en: 'Strategy', fr: 'Stratégie', he: 'אסטרטגיה' },
  'стилистика': { en: 'Style', fr: 'Stylistique', he: 'סגנון' },
  'описание проекта': { en: 'Project Overview', fr: 'Aperçu du projet', he: 'סקירת פרויקט' },
  'описание работы': { en: 'Project Overview', fr: 'Aperçu du projet', he: 'סקירת פרויקט' },
  'о проекте': { en: 'About the Project', fr: 'À propos du projet', he: 'על הפרויקט' },
  'ключевые элементы': { en: 'Key Elements', fr: 'Éléments clés', he: 'אלמנטים מרכזיים' },
  'ключевые элементы дизайна': { en: 'Key Design Elements', fr: 'Éléments de design clés', he: 'אלמנטים עיצוביים מרכזיים' },
  'анализ дизайна': { en: 'Design Analysis', fr: 'Analyse du design', he: 'ניתוח עיצוב' },
  'графика и носители': { en: 'Graphics & Media', fr: 'Graphiques et supports', he: 'גרפיקה ומדיה' },
  'носители стиля': { en: 'Brand Applications', fr: 'Supports de marque', he: 'יישומי מותג' },
  'носители': { en: 'Applications', fr: 'Supports', he: 'יישומים' },
  'материалы и носители': { en: 'Materials & Applications', fr: 'Matériaux et supports', he: 'חומרים ויישומים' },
  'адаптивность': { en: 'Adaptability', fr: 'Adaptabilité', he: 'התאמה' },
  'эмоциональный ui': { en: 'Emotional UI', fr: 'UI émotionnel', he: 'ממשק רגשי' },
  'ux-сценарии': { en: 'UX Scenarios', fr: 'Scénarios UX', he: 'תרחישי UX' },
  'слоган': { en: 'Slogan', fr: 'Slogan', he: 'סלוגן' },
  'посыл': { en: 'Message', fr: 'Message', he: 'מסר' },
  'шрифтовая система': { en: 'Font System', fr: 'Système typographique', he: 'מערכת גופנים' },
  'цель': { en: 'Goal', fr: 'Objectif', he: 'מטרה' },
}

function translateHeading(heading: string, locale: string): string {
  const key = heading.toLowerCase().replace(/[\s-]+/g, '-').replace(/[^a-zа-яё0-9-]/g, '')
  const t = headingMap[key]
  // Also try lookup by exact match
  const t2 = headingMap[heading.toLowerCase().trim()]
  const result = t?.[locale] || t2?.[locale] || heading
  return result
}

function buildContent(sections: Array<{ heading: string | null; content: string[] }>, locale: string): string {
  const parts: string[] = []
  for (const section of sections) {
    if (section.heading) {
      parts.push(`### ${translateHeading(section.heading, locale)}`)
    }
    for (const text of section.content) {
      if (text.trim()) {
        // Split long text into paragraphs
        const paragraphs = text.split(/\n{2,}/)
        for (const p of paragraphs) {
          const trimmed = p.trim()
          if (trimmed) {
            parts.push(trimmed)
          }
        }
      }
    }
  }
  return parts.join('\n\n')
}

const raw = JSON.parse(readFileSync(JSON_PATH, 'utf-8'))
const entries = raw.entries

const sqlite = new Database(DB_PATH)
const db = drizzle(sqlite, { schema })

let updated = 0
const locales = ['en', 'fr', 'he']
const insertItems: Array<{ locale: string; key: string; value: string }> = []

for (const entry of entries) {
  const baseSlug = entry.title.toLowerCase()
    .replace(/[«»"]/g, '').replace(/[^a-z0-9а-яё-]/g, '-')
    .replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 80)
  const itemSlug = `${baseSlug}-${entry.id}`

  const item = db.select().from(schema.portfolioItems).where(eq(schema.portfolioItems.slug, itemSlug)).get()
  if (!item) {
    console.warn(`⚠️  Not found: ${entry.title}`)
    continue
  }

  const sections = entry.sections || []
  for (const locale of locales) {
    const content = buildContent(sections, locale)
    if (content) {
      insertItems.push({
        locale,
        key: `portfolio_item.${item.id}.content`,
        value: content
      })
    }
  }
  updated++
}

// Batch insert
const now = Date.now()
const insert = sqlite.prepare('INSERT OR IGNORE INTO translations (locale, key, value, updated_at) VALUES (?, ?, ?, ?)')
const tx = sqlite.transaction(() => {
  for (const row of insertItems) {
    insert.run(row.locale, row.key, row.value, now)
  }
})
tx()

console.log(`✅ Processed ${updated} items → ${insertItems.length} translation rows`)
