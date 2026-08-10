declare global {
  namespace App {
    interface Locals {
      user?: {
        id: number
        email: string
        /** Effective role slug — the stored role's slug when roleId is set, else the legacy role. */
        role: string
        name: string | null
        roleId?: number | null
      }
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
