/**
 * Legal Markdown Renderer — XSS-safe subset of markdown for legal documents.
 *
 * Ported from PM v2 app/utils/legal-markdown.ts (PM2 parity). The strategy is
 * escape-first: all HTML is escaped before applying a small set of markdown
 * transforms (headings, lists, blockquotes, inline code/bold/italic/links), so
 * stored content can never inject markup. The rendered HTML is safe to emit
 * via {@html} and needs no additional sanitize pass.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderInlineMarkdown(value: string): string {
  let escaped = escapeHtml(value)

  escaped = escaped.replace(/\*\*\*\*/g, '')
  escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>')
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  escaped = escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  escaped = escaped.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g, (full, text, href) => `<a href="${href ?? ''}" target="_blank" rel="noopener noreferrer">${text ?? ''}</a>`)

  return escaped
}

function wrapParagraph(lines: string[]): string {
  const visibleLines = lines.filter(line => line.trim() !== '****')
  if (visibleLines.length === 0) return ''

  const text = visibleLines.map(line => renderInlineMarkdown(line)).join('<br />')
  const onlyLine = visibleLines[0]
  const isMeta = visibleLines.length === 1 && !!onlyLine && /^(Дата публикации|Редакция от|Publication date|Version dated):?/.test(onlyLine)
  const className = isMeta ? ' class="legal-page__meta"' : ''

  return `<p${className}>${text}</p>`
}

/**
 * Render a legal document's markdown to HTML. Safe for {@html} because every
 * user byte is HTML-escaped before the markdown transforms run.
 */
export function renderLegalMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const output: string[] = []
  let paragraphBuffer: string[] = []
  let listType: 'ul' | 'ol' | null = null
  let listItems: string[] = []
  let quoteBuffer: string[] = []

  function flushParagraph(): void {
    if (paragraphBuffer.length === 0) return
    const paragraph = wrapParagraph(paragraphBuffer)
    if (paragraph) output.push(paragraph)
    paragraphBuffer = []
  }

  function flushList(): void {
    if (!listType || listItems.length === 0) return
    output.push(`<${listType}>${listItems.join('')}</${listType}>`)
    listType = null
    listItems = []
  }

  function flushQuote(): void {
    if (quoteBuffer.length === 0) return
    output.push(`<blockquote>${quoteBuffer.map(line => `<p>${renderInlineMarkdown(line)}</p>`).join('')}</blockquote>`)
    quoteBuffer = []
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) {
      flushParagraph()
      flushList()
      flushQuote()
      continue
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      flushParagraph()
      flushList()
      flushQuote()
      const level = headingMatch[1]?.length ?? 1
      const headingText = headingMatch[2] ?? ''
      output.push(`<h${level}>${renderInlineMarkdown(headingText)}</h${level}>`)
      continue
    }

    const quoteMatch = trimmed.match(/^>\s?(.*)$/)
    if (quoteMatch) {
      flushParagraph()
      flushList()
      quoteBuffer.push(quoteMatch[1] ?? '')
      continue
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/)
    if (orderedMatch) {
      flushParagraph()
      flushQuote()
      if (listType && listType !== 'ol') {
        flushList()
      }
      listType = 'ol'
      listItems.push(`<li>${renderInlineMarkdown(orderedMatch[1] ?? '')}</li>`)
      continue
    }

    const unorderedMatch = trimmed.match(/^[-*]\s+(.+)$/)
    if (unorderedMatch) {
      flushParagraph()
      flushQuote()
      if (listType && listType !== 'ul') {
        flushList()
      }
      listType = 'ul'
      listItems.push(`<li>${renderInlineMarkdown(unorderedMatch[1] ?? '')}</li>`)
      continue
    }

    flushList()
    flushQuote()
    paragraphBuffer.push(trimmed)
  }

  flushParagraph()
  flushList()
  flushQuote()

  return output.join('\n')
}
