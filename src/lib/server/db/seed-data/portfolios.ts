/**
 * Portfolio Fixture Seed — representative portfolio content for local environments.
 *
 * PM2 portfolio parity for PRODUCTION content requires the separate
 * `scripts/import-pm2-content.ts` import step (see README). This fixture gives
 * a fresh `db:reset` boot representative portfolios + items so the public
 * listing, detail pages and the subtype viewers render real data locally —
 * WITHOUT any external source database.
 *
 * Idempotent: skips when the portfolios table already has rows. Per-type item
 * metadata is serialized through the canonical `normalizeItemMetadata` helper
 * (the same contract the admin forms and APIs use), so the fixture exercises
 * the exact runtime shape. Media URLs point at the COMMITTED placeholder assets
 * in `public/portfolio-fixtures/` (public/uploads/* is gitignored production
 * uploads), so a fresh `db:reset` renders working portfolio media with no
 * import step.
 */
import { useDatabase, schema } from '$lib/server/db'
import { normalizeItemMetadata } from '$lib/portfolio-metadata'

interface FixtureItem {
  itemType: 'image' | 'video' | 'link' | 'case_study'
  order: number
  title?: string
  description?: string
  content?: string
  mediaUrl?: string
  thumbnailUrl?: string
  category?: string
  metadata: Record<string, unknown> | null
}

interface FixturePortfolio {
  slug: string
  name: string
  description: string
  type: 'gallery' | 'case_study' | 'branding' | 'brandbook' | 'website'
  coverImageUrl?: string
  order: number
  items: FixtureItem[]
}

const PORTFOLIO_FIXTURES: FixturePortfolio[] = [
  {
    slug: 'branding',
    name: 'Брендинг',
    description: 'Айдентика и фирменный стиль: логотипы, носители, гайдлайны.',
    type: 'branding',
    order: 1,
    items: [
      {
        itemType: 'image',
        order: 1,
        title: 'Фирменный стиль FABRICA22',
        category: 'Брендинг',
        description: 'Разработка айдентики производственной студии.',
        mediaUrl: '/portfolio-fixtures/branding-1.png',
        metadata: {
          clientUrl: 'https://fabrica22.pro',
          tags: ['айдентика', 'логотип'],
          sections: [
            { title: 'Концепция', text: 'Минималистичная айдентика, построенная на чистой типографике.' }
          ]
        }
      },
      {
        itemType: 'image',
        order: 2,
        title: 'Носители бренда',
        category: 'Брендинг',
        description: 'Полиграфия и упаковка в едином фирменном стиле.',
        mediaUrl: '/portfolio-fixtures/branding-2.png',
        metadata: {
          clientUrl: 'https://fabrica22.pro',
          tags: ['полиграфия']
        }
      }
    ]
  },
  {
    slug: 'websites',
    name: 'Сайты',
    description: 'Продающие сайты и веб-приложения под ключ.',
    type: 'website',
    order: 2,
    items: [
      {
        itemType: 'image',
        order: 1,
        title: 'Корпоративный сайт',
        category: 'Веб',
        description: 'Многостраничный сайт с админ-панелью.',
        mediaUrl: '/portfolio-fixtures/website-1.png',
        thumbnailUrl: '/portfolio-fixtures/website-1-thumb.png',
        metadata: {
          liveUrl: 'https://fabrica22.pro',
          technologies: ['SvelteKit', 'SQLite'],
          screenshots: [
            { url: '/portfolio-fixtures/website-1.png', caption: 'Главная' },
            { url: '/portfolio-fixtures/website-2.png', caption: 'Каталог' }
          ]
        }
      }
    ]
  },
  {
    slug: 'case-studies',
    name: 'Кейсы',
    description: 'Разборы проектов: от задачи до результата.',
    type: 'case_study',
    order: 3,
    items: [
      {
        itemType: 'case_study',
        order: 1,
        title: 'Терминал самообслуживания',
        category: 'Кейс',
        description: 'Как мы проектировали интерфейс киоска.',
        content: '### Задача\n\nСпроектировать интерфейс терминала, понятный без обучения.\n\n### Решение\n\nКрупные кнопки, пошаговый сценарий и голосовые подсказки.',
        metadata: { tags: ['kiosk', 'ux'] }
      }
    ]
  },
  {
    slug: 'brandbook',
    name: 'Брендбук',
    description: 'Гайдлайны по использованию фирменного стиля.',
    type: 'brandbook',
    order: 4,
    items: [
      {
        itemType: 'image',
        order: 1,
        title: 'Гайдлайн по логотипу',
        category: 'Гайдлайн',
        description: 'Правила построения и охранные поля.',
        mediaUrl: '/portfolio-fixtures/brandbook-1.png',
        thumbnailUrl: '/portfolio-fixtures/brandbook-1-thumb.png',
        metadata: {
          pdfUrl: '/portfolio-fixtures/brandbook.pdf',
          pages: [
            { url: '/portfolio-fixtures/brandbook-1.png', caption: 'Логотип' },
            { url: '/portfolio-fixtures/brandbook-2.png', caption: 'Цвета' }
          ]
        }
      }
    ]
  }
]

/** Seed representative portfolio fixtures (idempotent — skips non-empty). */
export function seedPortfolios() {
  const db = useDatabase()
  console.log('🎨 Portfolio fixtures...')
  const existing = db.select().from(schema.portfolios).all()
  if (existing.length > 0) {
    console.log(`   ${existing.length} portfolios exist, skipping.`)
    console.log('')
    return
  }

  for (const fixture of PORTFOLIO_FIXTURES) {
    const portfolio = db.insert(schema.portfolios)
      .values({
        slug: fixture.slug,
        name: fixture.name,
        description: fixture.description,
        type: fixture.type,
        coverImageUrl: fixture.coverImageUrl ?? null,
        order: fixture.order,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning()
      .get()

    for (const item of fixture.items) {
      db.insert(schema.portfolioItems)
        .values({
          portfolioId: portfolio.id,
          itemType: item.itemType,
          order: item.order,
          published: true,
          title: item.title ?? null,
          description: item.description ?? null,
          content: item.content ?? null,
          mediaUrl: item.mediaUrl ?? null,
          thumbnailUrl: item.thumbnailUrl ?? null,
          category: item.category ?? null,
          metadata: normalizeItemMetadata(item.metadata, fixture.type)
        })
        .run()
    }
    console.log(`   ✓ ${fixture.slug}`)
  }
  console.log('')
}
