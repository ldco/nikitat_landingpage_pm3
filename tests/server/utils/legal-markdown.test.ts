import { describe, expect, it } from 'vitest'
import { renderLegalMarkdown } from '../../../app/utils/legal-markdown'

describe('legal markdown renderer', () => {
  it('drops empty bold placeholders and renders document dates as metadata', () => {
    const html = renderLegalMarkdown(`****
Дата публикации: 24 марта 2026 г.

## 1. Общие положения

- Оператор: ****`)

    expect(html).not.toContain('****')
    expect(html).not.toContain('<br />Дата публикации')
    expect(html).toContain('<p class="legal-page__meta">Дата публикации: 24 марта 2026 г.</p>')
    expect(html).toContain('<h2>1. Общие положения</h2>')
    expect(html).toContain('<li>Оператор: </li>')
  })
})
