declare global {
  namespace App {
    interface Locals {
      user?: {
        id: number
        email: string
        role: 'master' | 'admin' | 'editor'
        name: string | null
      }
      nonce?: string
      paraglide?: {
        lang: string
        textDirection: 'ltr' | 'rtl'
      }
      i18n?: {
        lang: string
      }
    }
  }
}

export {}
