/**
 * Hero Title Line-Break Algorithm
 *
 * Ported from PM v2 SectionHero.vue (lines 31-185)
 * Splits hero titles into lines with brand-colored accent segments.
 *
 * Rules:
 * - Glue words (prepositions, conjunctions) attach to the next word
 * - " — " separator → everything after is brand-colored
 * - " с " separator → everything after is brand-colored
 * - Otherwise: 45%/55% split, second part is brand-colored
 * - Each line balanced by character count per locale
 */

export interface HeroTextSegment {
  text: string
  brand: boolean
}

const RUSSIAN_GLUE_WORDS = new Set([
  'а', 'в', 'во', 'для', 'до', 'и', 'из', 'к', 'ко', 'на', 'над', 'не', 'но', 'о', 'об',
  'от', 'по', 'под', 'при', 'с', 'со', 'у'
])

const ENGLISH_GLUE_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'by', 'for', 'from', 'in', 'of', 'on', 'or', 'the', 'to'
])

function normalizeGlueToken(token: string): string {
  return token
    .toLocaleLowerCase()
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
}

function getGlueWords(locale: string): Set<string> {
  return locale.startsWith('ru') ? RUSSIAN_GLUE_WORDS : ENGLISH_GLUE_WORDS
}

function buildWordGroups(text: string, locale: string): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean)
  const glueWords = getGlueWords(locale)
  const groups: string[] = []

  for (let index = 0; index < words.length; index += 1) {
    const word = words[index]
    if (!word) continue
    const normalizedWord = normalizeGlueToken(word)

    if (!normalizedWord && groups.length > 0) {
      groups[groups.length - 1] = `${groups[groups.length - 1]} ${word}`
      continue
    }

    if (glueWords.has(normalizedWord) && index < words.length - 1) {
      const nextWord = words[index + 1]
      if (nextWord) {
        groups.push(`${word} ${nextWord}`)
        index += 1
        continue
      }
    }

    groups.push(word)
  }

  return groups
}

function splitWordGroupsIntoLines(groups: string[], targetCharsPerLine: number): string[] {
  if (groups.length === 0) return []
  if (groups.length === 1) return groups

  const totalCharacters = groups.join(' ').length
  const desiredLineCount = Math.min(groups.length, Math.max(1, Math.ceil(totalCharacters / targetCharsPerLine)))

  const lines: string[] = []
  let currentLine = ''
  let remainingCharacters = totalCharacters

  groups.forEach((group, index) => {
    const remainingLines = Math.max(1, desiredLineCount - lines.length)
    const balancedTarget = Math.ceil(remainingCharacters / remainingLines)
    const softLimit = Math.max(targetCharsPerLine - 2, Math.min(targetCharsPerLine + 4, balancedTarget))
    const nextLine = currentLine ? `${currentLine} ${group}` : group

    if (currentLine && nextLine.length > softLimit && lines.length < desiredLineCount - 1) {
      lines.push(currentLine)
      currentLine = group
    } else {
      currentLine = nextLine
    }

    remainingCharacters -= group.length + (index < groups.length - 1 ? 1 : 0)
  })

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

function splitSegmentIntoLines(text: string, locale: string, brand: boolean, compact: boolean): HeroTextSegment[] {
  const isRussian = locale.startsWith('ru')
  const targetCharsPerLine = compact
    ? (isRussian ? (brand ? 10 : 11) : (brand ? 13 : 15))
    : (isRussian ? (brand ? 27 : 28) : (brand ? 34 : 34))

  return splitWordGroupsIntoLines(buildWordGroups(text, locale), targetCharsPerLine)
    .map(line => ({ text: line, brand }))
}

/**
 * Main entry: breaks a hero title into brand-colored segments
 *
 * @param rawTitle — The full title text
 * @param locale — Current locale string (e.g. 'ru', 'en')
 * @param compact — Whether to use tighter character limit per line
 */
export function breakHeroTitle(rawTitle: string, locale: string, compact = false): HeroTextSegment[] {
  const title = rawTitle.trim()
  if (!title) return []

  // " — " separator: lead is normal, rest is brand
  if (title.includes(' — ')) {
    const parts = title.split(' — ')
    const lead = parts[0] ?? ''
    const rest = parts.slice(1).join(' — ').trim()
    return [
      ...splitSegmentIntoLines(`${lead.trim()} —`, locale, false, compact),
      ...splitSegmentIntoLines(rest, locale, true, compact)
    ].filter(s => s.text)
  }

  // " с " separator (Russian "with"): lead is normal, rest is brand
  if (title.includes(' с ')) {
    const parts: string[] = title.split(' с ')
    const lead = parts[0] ?? ''
    const rest = parts.slice(1).join(' с ').trim()
    return [
      ...splitSegmentIntoLines(lead.trim(), locale, false, compact),
      ...splitSegmentIntoLines(`с ${rest}`, locale, true, compact)
    ].filter(s => s.text)
  }

  // Default: 45%/55% split
  const words = title.split(/\s+/).filter(Boolean)
  const splitIndex = Math.max(1, Math.ceil(words.length * 0.45))
  const lead = words.slice(0, splitIndex).join(' ').trim()
  const accent = words.slice(splitIndex).join(' ').trim()

  return [
    ...splitSegmentIntoLines(lead, locale, false, compact),
    ...splitSegmentIntoLines(accent, locale, true, compact)
  ].filter(s => s.text)
}
