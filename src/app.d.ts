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
        /** First-login hardening: true until the bootstrap credential is replaced. */
        mustChangePassword?: boolean
      }
      paraglide?: {
        lang: string
        textDirection: 'ltr' | 'rtl'
      }
      i18n?: {
        lang: string
      }
      /**
       * Form body parsed once by the CSRF hook for `_csrf` field validation
       * (double-submit). Actions reuse it instead of re-parsing the request.
       */
      csrfForm?: FormData
    }
  }
}

export {}
