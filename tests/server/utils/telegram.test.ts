import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../server/utils/site-settings', () => ({
  getSettingValue: (key: string) => {
    if (key === 'contact.telegramBotToken') return '123456789:abcdefghijklmnopqrstuvwxyz'
    if (key === 'contact.telegramChatId') return '-1001234567890'
    return ''
  }
}))

vi.mock('../../../server/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}))

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('Telegram contact notifications', () => {
  it('sends metadata-only contact notifications', async () => {
    const fetchMock = vi.fn(async () => ({
      json: async () => ({ ok: true })
    }))
    vi.stubGlobal('fetch', fetchMock)

    const { notifyNewContact } = await import('../../../server/utils/telegram')

    const delivered = await notifyNewContact({
      submissionId: 42,
      createdAt: new Date('2026-03-24T12:00:00.000Z')
    })

    expect(delivered).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [, request] = fetchMock.mock.calls[0]
    const payload = JSON.parse(String(request.body))

    expect(payload.text).toContain('Submission ID:</b> #42')
    expect(payload.text).toContain('24.03.2026 15:00')
    expect(payload.text).toContain('Personal data was not sent to Telegram')
    expect(payload.text).not.toContain('Name:')
    expect(payload.text).not.toContain('Contact:')
    expect(payload.text).not.toContain('Phone:')
    expect(payload.text).not.toContain('Message:')
  })
})
