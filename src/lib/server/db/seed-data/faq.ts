/**
 * FAQ Seed — starter FAQ items with 4-locale translations.
 *
 * Only runs when the FAQ table is empty.
 */
import { useDatabase, schema } from '$lib/server/db'

const FAQ_SEED: Array<{
  slug: string
  category: string
  order: number
  translations: Record<string, { question: string; answer: string }>
}> = [
  {
    slug: 'what-is-this-demo',
    category: 'framework',
    order: 1,
    translations: {
      ru: {
        question: 'Что это за стартовый контент?',
        answer: 'Это стартовый контент PM, используемый базовым Puppet Master до генерации реального проекта.'
      },
      en: {
        question: 'What is this starter content?',
        answer: 'It is PM master starter content used by the vanilla Puppet Master baseline before a real project layer is generated.'
      },
      fr: {
        question: 'Qu\'est-ce que ce contenu de démarrage ?',
        answer: 'C\'est le contenu de démarrage PM utilisé par la base Puppet Master vanilla avant la génération d\'un vrai projet.'
      },
      he: {
        question: 'מהו תוכן הפתיחה הזה?',
        answer: 'זהו תוכן פתיחה של PM המשמש את קו הבסיס של Puppet Master לפני יצירת שכבת פרויקט אמיתית.'
      }
    }
  },
  {
    slug: 'how-do-i-generate-a-project',
    category: 'greenfield',
    order: 2,
    translations: {
      ru: {
        question: 'Как сгенерировать реальный проект?',
        answer: 'Добавьте заметки, промпты и ссылки на ассеты в project/init/concept_docs, затем запустите greenfield intake.'
      },
      en: {
        question: 'How do I generate a real project?',
        answer: 'Add project notes, prompts, text, and asset references to project/init/concept_docs, then run the greenfield intake command.'
      },
      fr: {
        question: 'Comment générer un vrai projet ?',
        answer: 'Ajoutez notes, prompts, textes et références d\'assets dans project/init/concept_docs, puis lancez la commande greenfield intake.'
      },
      he: {
        question: 'איך יוצרים פרויקט אמיתי?',
        answer: 'הוסיפו הערות, הנחיות, טקסט והפניות לנכסים ב-project/init/concept_docs, ואז הריצו את פקודת ה-greenfield intake.'
      }
    }
  },
  {
    slug: 'what-are-the-defaults',
    category: 'defaults',
    order: 3,
    translations: {
      ru: {
        question: 'Что произойдёт, если greenfield-промпт не заполнен?',
        answer: 'Intake откатится к нейтральному англоязычному сайту с админкой, onepager-навигацией, контактом, FAQ, фичами.'
      },
      en: {
        question: 'What happens if the greenfield prompt is not filled?',
        answer: 'The intake falls back to a neutral English website with admin, onepager navigation, contact, FAQ, and features.'
      },
      fr: {
        question: 'Que se passe-t-il si le prompt greenfield n\'est pas rempli ?',
        answer: 'L\'intake revient à un site anglais neutre avec admin, navigation onepager, contact, FAQ et features.'
      },
      he: {
        question: 'מה קורה אם הנחיית ה-greenfield לא מולאה?',
        answer: 'ה-intake נופל חזרה לאתר אנגלי נייטרלי עם ניהול, ניווט onepager, יצירת קשר, שאלות נפוצות ויכולות.'
      }
    }
  }
]

export function seedFaq() {
  const db = useDatabase()
  console.log('❓ FAQ items...')
  const existing = db.select().from(schema.faqItems).all()
  if (existing.length > 0) {
    console.log(`   ${existing.length} FAQ items exist, skipping.`)
    return
  }

  for (const item of FAQ_SEED) {
    const inserted = db.insert(schema.faqItems).values({
      slug: item.slug,
      category: item.category,
      published: true,
      order: item.order
    }).returning().get()

    for (const [locale, tr] of Object.entries(item.translations)) {
      db.insert(schema.faqItemTranslations).values({
        faqItemId: inserted.id,
        locale,
        question: tr.question,
        answer: tr.answer
      }).run()
    }
    console.log(`   ✓ ${item.slug}`)
  }
  console.log('')
}
