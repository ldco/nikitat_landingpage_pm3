/**
 * Fix section parsing — splits content on sub-headings like "Логотип:", "Цветовая палитра:", etc.
 * Run with: npx tsx server/database/fix-sections.ts
 */
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { eq } from 'drizzle-orm'
import * as schema from './schema'

const DB_PATH = process.env.DATABASE_URL || './data/sqlite.db'

const sqlite = new Database(DB_PATH)
const db = drizzle(sqlite, { schema })

const subheadingKeywords = [
  'Логотип', 'Цветовая палитра', 'Цветовая гамма', 'Палитра',
  'Типографика', 'Концепция', 'Реализация', 'Решение',
  'Результат', 'Итог', 'Носители стиля', 'Носители',
  'Графика и носители', 'Графика',
  'Описание проекта', 'Описание работы', 'О проекте',
  'Ключевые элементы дизайна', 'Ключевые элементы',
  'Анализ дизайна', 'Дизайн-решения',
  'Визуальный код', 'Визуальные решения',
  'Позиционирование', 'Стратегия',
  'Применение айдентика', 'Адаптивность',
  'Стилистика', 'Материалы и носители',
  'Цель', 'Посыл',
  'UX-сценарии', 'Эмоциональный UI', 'Колористика',
  'Слоган', 'Цветовая стратегия', 'Шрифтовая система',
  'Типографика и цвет', 'Айдентика'
]

function isSubheading(line: string): string | null {
  const t = line.trim()
  for (const kw of subheadingKeywords) {
    if (t.startsWith(kw + ':') || t.startsWith(kw + ':')) {
      return kw
    }
  }
  return null
}

const items = db.select().from(schema.portfolioItems).where(eq(schema.portfolioItems.portfolioId, 1)).all()

let fixed = 0
for (const item of items) {
  if (!item.metadata) continue

  let meta: { sections?: Array<{ heading: string | null; content: string[] }> }
  try {
    meta = JSON.parse(item.metadata as string)
  } catch {
    continue
  }

  if (!meta.sections || meta.sections.length === 0) continue

  const newSections: Array<{ heading: string | null; content: string[] }> = []

  for (const section of meta.sections) {
    // Flatten all content into individual lines
    const lines: string[] = []
    for (const c of section.content) {
      // Split on newlines within each content item
      if (c.includes('\n')) {
        for (const line of c.split('\n')) {
          lines.push(line)
        }
      } else {
        lines.push(c)
      }
    }

    // Group lines into sub-sections based on sub-headings
    let currentHeading: string | null = section.heading
    let currentContent: string[] = []

    for (const line of lines) {
      const sub = isSubheading(line)
      if (sub) {
        // Save previous sub-section
        if (currentContent.some(c => c.trim()) || currentHeading) {
          newSections.push({ heading: currentHeading, content: currentContent })
        }
        currentHeading = sub
        currentContent = []
        // Content after the colon on the same line
        const colonIdx = line.indexOf(':')
        if (colonIdx >= 0) {
          const remainder = line.substring(colonIdx + 1).trim()
          if (remainder) {
            currentContent.push(remainder)
          }
        }
      } else {
        currentContent.push(line.trim())
      }
    }

    // Save last sub-section
    if (currentContent.some(c => c.trim()) || currentHeading) {
      newSections.push({ heading: currentHeading, content: currentContent })
    }
  }

  // Clean up empty sections
  const cleaned = newSections.filter(s => s.content.some(c => c.trim()))

  if (JSON.stringify(cleaned) !== JSON.stringify(meta.sections)) {
    meta.sections = cleaned
    db.update(schema.portfolioItems)
      .set({ metadata: JSON.stringify(meta) })
      .where(eq(schema.portfolioItems.id, item.id))
      .run()
    console.log(`  ✓ ${item.id}: ${cleaned.length} sections (was ${meta.sections.length})`)
    fixed++
  }
}

console.log(`\n✅ Fixed ${fixed} items with improved section structure`)
