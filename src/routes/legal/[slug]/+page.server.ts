import type { RequestEvent } from '@sveltejs/kit'
import { error } from '@sveltejs/kit'
import { readFileSync } from 'fs'

export function load({ params, locals }: RequestEvent) {
  const locale = locals.paraglide?.lang ?? 'ru'
  const slug = params.slug ?? ''

  // Map URL slug to file path
  const slugToFile: Record<string, string> = {
    'privacy-policy': 'privacy-policy',
    'personal-data-policy': 'personal-data-policy',
    'terms-of-service': 'terms-of-service'
  }

  const fileSlug = slugToFile[slug]
  if (!fileSlug) error(404, 'Page not found')

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
      error(404, 'Page not found')
    }
  }
}
