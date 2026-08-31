/**
 * Social URL Builder — platform-aware normalization of social link values.
 *
 * Admin settings store handles as plain handles/phone numbers (e.g. `@ldandco`,
 * `+7 900 123-45-67`) — raw strings that are NOT usable as hrefs. This is the
 * single shared converter so every surface (SocialNav footer icons,
 * HeaderContact quick buttons) renders working links with identical output.
 * Full URLs (http/https) pass through untouched; any other value for a
 * platform without a dedicated builder is dropped (empty string) so arbitrary
 * URI schemes like `javascript:` can never reach an href attribute.
 */
export function buildSocialUrl(platform: string, value: string): string {
  const raw = value.trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw

  const key = (platform.split('.').pop() ?? platform).toLowerCase()
  switch (key) {
    case 'telegram':
    case 'telegramchannel': {
      const handle = raw.replace(/^@/, '')
      return handle ? `https://t.me/${handle}` : raw
    }
    case 'whatsapp': {
      const digits = raw.replace(/\D/g, '')
      return digits ? `https://wa.me/${digits}` : raw
    }
    case 'viber': {
      const digits = raw.replace(/\D/g, '')
      return digits ? `viber://chat?number=${digits}` : raw
    }
    case 'discord':
    case 'discordserver': {
      const code = raw.replace(/^discord\.gg\//, '')
      return code ? `https://discord.gg/${code}` : raw
    }
    default: {
      // Only allow http(s) — anything else (javascript:, data:, vbscript:, or
      // a scheme-less string) is dropped so it can never render as an href.
      try {
        const u = new URL(raw)
        return u.protocol === 'http:' || u.protocol === 'https:' ? raw : ''
      } catch {
        return ''
      }
    }
  }
}
