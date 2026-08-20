import { describe, it, expect } from 'vitest'
import {
  expectedScripts,
  scriptCounts,
  dominantScript,
  stripCodeTokens,
  scriptMismatch,
  isRawKeyValue,
  loadScriptAllowlist
} from '../../scripts/lib/i18n-scripts.mjs'

/**
 * Framework-level i18n script checks — LANGUAGE-AGNOSTIC by design. These
 * helpers must work for ANY locale set a project configures (ru/en/fr/he
 * here, but also ar, ja, zh, de, pl, …): wrong-language text is detected by
 * comparing a value's dominant SCRIPT against the script its locale requires,
 * never by hardcoding a language list.
 */

describe('expectedScripts — locale → script mapping (Intl-driven, no hardcoding)', () => {
  it('maps the project locales to their canonical scripts', () => {
    expect(expectedScripts('ru')).toEqual(['Cyrillic'])
    expect(expectedScripts('en')).toEqual(['Latin'])
    expect(expectedScripts('fr')).toEqual(['Latin'])
    expect(expectedScripts('he')).toEqual(['Hebrew'])
  })

  it('supports scripts outside the current project (any-language guarantee)', () => {
    expect(expectedScripts('ar')).toEqual(['Arabic'])
    expect(expectedScripts('uk')).toEqual(['Cyrillic'])
    expect(expectedScripts('el')).toEqual(['Greek'])
    expect(expectedScripts('hi')).toEqual(['Devanagari'])
    expect(expectedScripts('th')).toEqual(['Thai'])
    expect(expectedScripts('zh')).toEqual(['Han'])
  })

  it('expands composite script tags to their member scripts', () => {
    expect(expectedScripts('ja')).toEqual(['Han', 'Hiragana', 'Katakana'])
    expect(expectedScripts('ko')).toEqual(['Hangul', 'Han'])
  })

  it('returns an empty set for unknown/unparseable locale codes', () => {
    expect(expectedScripts('')).toEqual([])
    expect(expectedScripts('xx-invalid')).toEqual([])
  })
})

describe('scriptCounts / dominantScript — value script detection', () => {
  it('counts letters per script', () => {
    const counts = scriptCounts('Привет мир Hello')
    expect(counts.Cyrillic).toBe(9)
    expect(counts.Latin).toBe(5)
  })

  it('picks the dominant script', () => {
    expect(dominantScript('Привет мир Hello')).toBe('Cyrillic')
    expect(dominantScript('Hello world Привет')).toBe('Latin')
    expect(dominantScript('')).toBeNull()
    expect(dominantScript('12345 !!!')).toBeNull()
  })
})

describe('stripCodeTokens — technical copy must not be flagged', () => {
  it('removes dotted i18n keys', () => {
    expect(stripCodeTokens('например, hero.title или about.description')).not.toMatch(/hero/)
    expect(stripCodeTokens('например, hero.title или about.description')).not.toMatch(/description/)
  })

  it('removes tag:name references, snake/kebab identifiers and masks', () => {
    expect(stripCodeTokens('שם אייקון Tabler (למשל, tabler:star)')).not.toMatch(/tabler:star/)
    expect(stripCodeTokens('common_newKey admin_label')).not.toMatch(/newKey/)
    expect(stripCodeTokens('Идентификатор Google Analytics (G-XXXXXXXX)')).not.toMatch(/XXXXXXXX/)
    expect(stripCodeTokens('param {foo} done')).not.toMatch(/foo/)
    expect(stripCodeTokens('see https://example.com/x for details')).not.toMatch(/https/)
  })

  it('keeps normal prose untouched', () => {
    const text = 'Это полностью корректное русское предложение с нормальным текстом.'
    expect(stripCodeTokens(text)).toBe(text)
  })
})

describe('scriptMismatch — wrong-language text detection', () => {
  it('flags French/Latin copy pasted into a Hebrew row (the flagship case)', () => {
    const reason = scriptMismatch('he', 'Ceci est un texte français complet écrit en français sur une page hébraïque.')
    expect(reason).toMatch(/Latin-script text in the he locale/)
    expect(reason).toMatch(/wrong-language copy/)
  })

  it('flags English copy in a Russian row', () => {
    expect(scriptMismatch('ru', 'This is a full English sentence that was accidentally left untranslated in the Russian row.')).toMatch(/Latin-script text in the ru locale/)
  })

  it('flags Russian copy in English/French rows', () => {
    expect(scriptMismatch('en', 'Это полное русское предложение, которое случайно осталось непереведённым в английской строке.')).toMatch(/Cyrillic-script text in the en locale/)
    expect(scriptMismatch('fr', 'Это полное русское предложение, которое случайно осталось непереведённым во французской строке.')).toMatch(/Cyrillic-script text in the fr locale/)
  })

  it('flags Hebrew copy in a Russian row', () => {
    expect(scriptMismatch('ru', 'זהו טקסט עברי מלא שנכנס בטעות לשורה הרוסית וצריך להיות מתורגם לרוסית.')).toMatch(/Hebrew-script text in the ru locale/)
  })

  it('accepts values written in the correct script, even with embedded terms', () => {
    const ok: Array<[string, string]> = [
      ['ru', 'Это полностью корректное русское предложение с нормальным текстом.'],
      ['he', 'תפקיד עם slug זה כבר קיים בפרויקט הזה והוא נחשב תקין לחלוטין.'],
      ['fr', 'Ceci est un texte français tout à fait correct avec un contenu normal.']
    ]
    for (const [locale, text] of ok) expect(scriptMismatch(locale, text)).toBeNull()
  })

  it('accepts Hebrew with embedded Latin code tokens after stripping', () => {
    const text = 'בקשת הגדרות לא תקינה, השתמש במפתח hero.title מההגדרות של המערכת'
    expect(scriptMismatch('he', text)).toBeNull()
  })

  it('skips short values — proper nouns and brand names are exempt', () => {
    expect(scriptMismatch('he', 'Bonjour')).toBeNull()
    expect(scriptMismatch('ru', 'To The Moon Tech')).toBeNull()
  })

  it('skips values with no detectable letters', () => {
    expect(scriptMismatch('he', '12345 !!!')).toBeNull()
    expect(scriptMismatch('he', '')).toBeNull()
    expect(scriptMismatch('he', '   ')).toBeNull()
  })

  it('returns null for locales it cannot classify', () => {
    expect(scriptMismatch('xx-invalid', 'Some English text of sufficient length to reach the threshold here.')).toBeNull()
  })

  it('accepts mixed-script prose when the expected script stays the majority', () => {
    // Russian text with an English brand name embedded — majority Cyrillic.
    const text = 'Компания Google Analytics предоставляет аналитику, а сервис работает отлично.'
    expect(scriptMismatch('ru', text)).toBeNull()
  })
})


describe('scriptMismatch — brand-heavy copy is NOT wrong-language (review fix)', () => {
  it('accepts correctly translated sentences dominated by Latin brand names', () => {
    const cases: Array<[string, string]> = [
      // 52% Latin letters — Google Analytics / Facebook Pixel brands.
      ['ru', 'Мы используем Google Analytics, Facebook Pixel и Яндекс Метрику'],
      // 62% Latin letters — Google Analytics / Facebook Pixel brands.
      ['he', 'תמיכה ב-Google Analytics וב-Facebook Pixel ובעוד כלים'],
      ['en', 'We use Google Analytics, Facebook Pixel and a custom CRM for tracking']
    ]
    for (const [locale, text] of cases) expect(scriptMismatch(locale, text)).toBeNull()
  })

  it('still flags near-total foreign dominance (>= 85% Latin in a non-Latin locale)', () => {
    expect(
      scriptMismatch('ru', 'This is an almost entirely English paragraph with only a couple of Russian words тут.')
    ).toMatch(/Latin-dominant text in the ru locale/)
  })

  it('still flags pure foreign copy', () => {
    expect(
      scriptMismatch('he', 'Ceci est un texte français complet écrit en français sur une page hébraïque.')
    ).toMatch(/wrong-language copy/)
  })
})

describe('isRawKeyValue — single shared raw-key normalization (review fix)', () => {
  it('flags dotted and underscore forms, case-insensitive, after trimming', () => {
    expect(isRawKeyValue('common.hello', 'common.hello')).toBe(true)
    expect(isRawKeyValue('common.hello', 'common_hello')).toBe(true)
    expect(isRawKeyValue('common.hello', 'Common.HELLO')).toBe(true)
    expect(isRawKeyValue('common.hello', '  COMMON_HELLO  ')).toBe(true)
  })

  it('accepts real text and blank/empty values', () => {
    expect(isRawKeyValue('common.hello', 'Привет мир')).toBe(false)
    expect(isRawKeyValue('common.hello', '')).toBe(false)
    expect(isRawKeyValue('common.hello', '   ')).toBe(false)
  })
})

describe('expectedScripts — memoized (review fix)', () => {
  it('returns the same results across repeated calls', () => {
    const a = expectedScripts('ru')
    const b = expectedScripts('ru')
    expect(a).toEqual(['Cyrillic'])
    expect(b).toEqual(['Cyrillic'])
  })
})

describe('loadScriptAllowlist — per-key intentional mixed-script exceptions', () => {
  it('loads the on-disk allowlist as a Set of dotted keys', () => {
    const allowlist = loadScriptAllowlist()
    expect(allowlist.has('init.features.onepager')).toBe(true)
    expect(allowlist.has('settings.analytics.googleId')).toBe(true)
  })
})
