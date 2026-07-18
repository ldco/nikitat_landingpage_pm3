/**
 * Update portfolio item descriptions — fixes auto-generated descriptions
 * to be meaningful, starting with a subject, not a verb.
 *
 * Run with: npx tsx server/database/update-descriptions.ts
 */
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { eq } from 'drizzle-orm'
import * as schema from './schema'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const DB_PATH = process.env.DATABASE_URL || './data/sqlite.db'
const JSON_PATH = join(process.cwd(), 'portfolio-parsed.json')

// Curated descriptions for all 36 branding entries
const descriptions: Record<number, string> = {
  1: 'Элитный IT-консалтинг — смысловая архитектура и фирменный стиль с премиальной монохромной палитрой.',
  2: 'Платформа автоматизации знаний — комплексная айдентика с ренессансной типографикой.',
  3: 'Сервис сбора обратной связи — эмоциональный брендинг с интерактивным маскотом.',
  4: 'B2B-фреймворк — бренд-система с метафорой кукловода и модульной геометрией.',
  5: 'Студия разработки ПО — строгий минимализм с динамичными горизонтальными линиями.',
  6: 'Израильский спа-сервис — премиальный стиль с тактильной природной эстетикой.',
  7: 'Премиальный персональный ассистент — айдентика с каллиграфической монограммой.',
  8: 'HoReCa-ПО — айдентика с фигурными скобками как символом программного кода.',
  9: 'Израильский сервис доставки суши — брендинг с маскотом и крафтовой упаковкой.',
  10: 'Криптовалютный проект — технологичная айдентика с модульной геометрией.',
  11: 'Студия кератинового выпрямления — премиальная айдентика с фиолетовым и золотом.',
  12: 'Сеть азиатского фастфуда — визуальная система с рукописной типографикой.',
  13: 'Nail-студия в Израиле — гламурный бренд в стиле Мэрилин Монро.',
  14: 'Крипто-проект — айдентика с образом ракеты в орбитальном контуре.',
  15: 'Израильский кейтеринг — стиль с каллиграфическим знаком и тёплыми оттенками.',
  16: 'Импортёр автомобилей — бренд-айдентика с агрессивной геометрией спорткаров.',
  17: 'ПО для создателей контента — айдентика с рукописной типографикой и фиолетовым свечением.',
  18: 'Элитный ювелирный бренд — минималистичная айдентика с монограммой.',
  19: 'Израильское кадровое агентство — айдентика с интеграцией ивритских огласовок.',
  20: 'JS-фреймворк — айдентика со стилизацией буквы «Цади» под UI-элемент.',
  21: 'Система автоматизации бизнеса — брендинг с амперсандом и коралловым акцентом.',
  22: 'Настольная карточная игра — айдентика с гравюрным образом и стилизацией под резьбу.',
  23: 'IT-компания — фирменный стиль с рубленой геометрией и сигнальным оранжевым.',
  24: 'Спа-салон в Израиле — айдентика с восточной лампой и бирюзовыми оттенками.',
  25: 'Web3-студия — айдентика с циклической структурой из стрелок и золотом.',
  26: 'ПО финансовой аналитики — айдентика с синтезом литеры P и символов кода.',
  27: 'Преподаватель языков — персональный бренд с авторским леттерингом Britney.',
  28: 'Платформа коллаборации — айдентика с модифицированными глифами Nord-Star Deco.',
  29: 'Клуб единоборств — бренд с антропоморфной капибарой и жёлто-чёрным контрастом.',
  30: 'Дизайнер Никита Т. — ребрендинг с фьюжн вязи и китайской печати zhuanke.',
  31: 'YouTube-канал о путешествиях — айдентика с ковбойской шляпой и земляными тонами.',
  32: 'Криптоэкосистема — бренд с минималистичным геометрическим знаком и неоновой гаммой.',
  33: 'Технологический стандарт — айдентика с крылом из перьев и сигнальным оранжевым.',
  34: 'Марка бижутерии в Израиле — айдентика с силуэтом сердца и пурпурным градиентом.',
  35: 'Приложение для изучения иврита — айдентика с конструктивной сеткой прописи.',
  36: 'Израильская компания-экспортёр — брендинг с массивным шрифтом и диагональной линией.',
}

function main() {
  // Read parsed JSON
  if (!existsSync(JSON_PATH)) {
    console.error(`❌ portfolio-parsed.json not found at ${JSON_PATH}`)
    process.exit(1)
  }
  const raw = JSON.parse(readFileSync(JSON_PATH, 'utf-8'))
  const entries = raw.entries
  console.log(`📖 Loaded ${entries.length} entries from portfolio-parsed.json`)

  // Connect to database
  if (!existsSync(DB_PATH)) {
    console.error(`❌ Database not found at ${DB_PATH}`)
    process.exit(1)
  }
  const sqlite = new Database(DB_PATH)
  const db = drizzle(sqlite, { schema })

  let updated = 0
  let errors = 0

  for (const entry of entries) {
    try {
      // Find the item in DB by matching slug or title
      const baseSlug = entry.title
        .toLowerCase()
        .replace(/[«»"]/g, '')
        .replace(/[^a-z0-9а-яё-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 80)
      const itemSlug = `${baseSlug}-${entry.id}`

      const item = db
        .select()
        .from(schema.portfolioItems)
        .where(eq(schema.portfolioItems.slug, itemSlug))
        .get()

      if (!item) {
        console.warn(`   ⚠️  Item not found for: ${entry.title} (slug: ${itemSlug})`)
        errors++
        continue
      }

      const description = descriptions[entry.id] || `Фирменный стиль для ${entry.title}`

      // Update the description in DB
      db.update(schema.portfolioItems)
        .set({ description })
        .where(eq(schema.portfolioItems.id, item.id))
        .run()

      console.log(`  ✓ ${entry.id}: ${description.substring(0, 70)}...`)
      updated++
    } catch (err) {
      console.error(`  ✗ ${entry.id} (${entry.title}): ${err instanceof Error ? err.message : String(err)}`)
      errors++
    }
  }

  console.log(`\n✅ Updated ${updated} descriptions, ${errors} errors`)
}

main()
