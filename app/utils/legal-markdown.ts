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
  escaped = escaped.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

  return escaped
}

function wrapParagraph(lines: string[]): string {
  const visibleLines = lines.filter(line => line.trim() !== '****')
  if (visibleLines.length === 0) return ''

  const text = visibleLines.map(line => renderInlineMarkdown(line)).join('<br />')
  const isMeta = visibleLines.length === 1 && /^(Дата публикации|Редакция от|Publication date|Version dated):?/.test(visibleLines[0])
  const className = isMeta ? ' class="legal-page__meta"' : ''

  return `<p${className}>${text}</p>`
}

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
      const level = headingMatch[1].length
      output.push(`<h${level}>${renderInlineMarkdown(headingMatch[2])}</h${level}>`)
      continue
    }

    const quoteMatch = trimmed.match(/^>\s?(.*)$/)
    if (quoteMatch) {
      flushParagraph()
      flushList()
      quoteBuffer.push(quoteMatch[1])
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
      listItems.push(`<li>${renderInlineMarkdown(orderedMatch[1])}</li>`)
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
      listItems.push(`<li>${renderInlineMarkdown(unorderedMatch[1])}</li>`)
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
