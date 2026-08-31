import { describe, it, expect } from 'vitest'
import { buildSocialUrl } from '$lib/utils/social-url'

describe('buildSocialUrl', () => {
  it('passes full URLs through untouched', () => {
    expect(buildSocialUrl('telegram', 'https://t.me/ldandco')).toBe('https://t.me/ldandco')
    expect(buildSocialUrl('instagram', 'http://instagram.com/foo')).toBe('http://instagram.com/foo')
  })

  it('builds t.me links from telegram handles (bare and dotted keys)', () => {
    expect(buildSocialUrl('telegram', '@ldandco')).toBe('https://t.me/ldandco')
    expect(buildSocialUrl('telegram', 'ldandco')).toBe('https://t.me/ldandco')
    expect(buildSocialUrl('social.telegram', ' @ldandco ')).toBe('https://t.me/ldandco')
    expect(buildSocialUrl('telegramchannel', '@fabrika22_channel')).toBe('https://t.me/fabrika22_channel')
    expect(buildSocialUrl('social.telegramChannel', '@fabrika22_channel')).toBe('https://t.me/fabrika22_channel')
  })

  it('builds wa.me links from whatsapp phone numbers', () => {
    expect(buildSocialUrl('whatsapp', '+7 900 123-45-67')).toBe('https://wa.me/79001234567')
    expect(buildSocialUrl('whatsapp', 'https://wa.me/79001234567')).toBe('https://wa.me/79001234567')
  })

  it('builds viber deep links', () => {
    expect(buildSocialUrl('viber', '+79001234567')).toBe('viber://chat?number=79001234567')
  })

  it('builds discord invite links from codes', () => {
    expect(buildSocialUrl('discord', 'discord.gg/abc123')).toBe('https://discord.gg/abc123')
    expect(buildSocialUrl('discord', 'abc123')).toBe('https://discord.gg/abc123')
  })

  it('passes full URLs through for platforms without special handling', () => {
    expect(buildSocialUrl('instagram', 'https://instagram.com/foo')).toBe('https://instagram.com/foo')
  })

  it('drops scheme-less values for platforms without special handling', () => {
    expect(buildSocialUrl('instagram', 'instagram.com/foo')).toBe('')
    expect(buildSocialUrl('github', 'github.com/org')).toBe('')
  })

  it('rejects arbitrary URI schemes that could execute as hrefs', () => {
    expect(buildSocialUrl('instagram', 'javascript:alert(1)')).toBe('')
    expect(buildSocialUrl('instagram', 'data:text/html,<script>1</script>')).toBe('')
    expect(buildSocialUrl('instagram', 'vbscript:msgbox(1)')).toBe('')
    expect(buildSocialUrl('facebook', 'javascript:alert(1)')).toBe('')
  })

  it('returns empty string for empty input', () => {
    expect(buildSocialUrl('telegram', '')).toBe('')
    expect(buildSocialUrl('telegram', '   ')).toBe('')
  })
})
