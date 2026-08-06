import type { PageServerLoad } from './$types'
import { error } from '@sveltejs/kit'
import { readFileSync } from 'fs'

export const load: PageServerLoad = ({ params, locals }) => {
  const locale = locals.paraglide?.lang ?? 'ru'
  const slug = params.slug ?? ''

  // Map URL slug to file path
  const slugToFile: Record<string, string> = {
    'privacy-policy': 'privacy-policy',
    'personal-data-policy': 'personal-data-policy',
    'terms-of-service': 'terms-of-service'
  }

  const fileSlug = slugToFile[slug]
  if (!fileSlug) error(404)

  const filePath = `legal/${locale}/${fileSlug}.md`
  try {
    const markdown = readFileSync(filePath, 'utf-8')
    return { markdown, slug }
  } catch {
    // Try fallback to English
    try {
      const markdown = readFileSync(`legal/en/${fileSlug}.md`, 'utf-8')
      return { markdown, slug }
    } catch {
      error(404)
    }
  }
}
