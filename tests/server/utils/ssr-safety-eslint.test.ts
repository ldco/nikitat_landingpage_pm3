import { RuleTester } from 'eslint'
import { describe, it } from 'vitest'
import ssrSafety from '../../../eslint-plugin-ssr-safety.js'

RuleTester.describe = describe
RuleTester.it = it

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
})

describe('ssr-safety/no-direct-config-access', () => {
  it('flags direct Vue imports of canonical project config paths', () => {
    ruleTester.run(
      'no-direct-config-access',
      ssrSafety.rules['no-direct-config-access'],
      {
        valid: [
          {
            filename: '/repo/app/components/Example.vue',
            code: `
              import { useSafeConfig } from '~~/pm-core/app/composables/useSafeConfig'
              const { isOnepager } = useSafeConfig()
            `
          },
          {
            filename: '/repo/app/components/Example.vue',
            code: `
              import config from '~~/project/puppet-master.config'
              const isOnepager = computed(() => config.features.onepager)
            `
          }
        ],
        invalid: [
          {
            filename: '/repo/app/components/Example.vue',
            code: `
              import config from '~~/project/puppet-master.config'
              const isOnepager = config.features.onepager
            `,
            errors: [{ messageId: 'directAccess' }]
          },
          {
            filename: '/repo/app/components/Example.vue',
            code: `
              import config from '../../project/puppet-master.config'
              const theme = config.defaultTheme
            `,
            errors: [{ messageId: 'directAccess' }]
          },
          {
            filename: '/repo/app/components/Example.vue',
            code: `
              import config from '~/project/puppet-master.config'
              const locale = config.defaultLocale
            `,
            errors: [{ messageId: 'directAccess' }]
          }
        ]
      }
    )
  })
})
