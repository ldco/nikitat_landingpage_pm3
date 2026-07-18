// https://nuxt.com/docs/api/configuration/nuxt-config
import { execSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import config from './project/puppet-master.config'
import Icons from 'unplugin-icons/vite'
import svgLoader from 'vite-svg-loader'

const rootDir = dirname(fileURLToPath(import.meta.url))
const optimizedImagesPublicDir = join(rootDir, 'node_modules', '.cache', 'pm-assets', 'images')
const isTestEnv = process.env.NODE_ENV === 'test'
const appVersion = process.env.APP_VERSION || '0.1.0'
const buildTimestamp = process.env.BUILD_TIMESTAMP || new Date().toISOString()
const buildSha = getBuildSha()
const buildBranch = process.env.BUILD_BRANCH || getBuildBranch()
const buildCommitMessage = process.env.BUILD_COMMIT_MESSAGE || getBuildCommitMessage()
const buildVersion =
  process.env.BUILD_VERSION ||
  `${buildTimestamp.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}-${buildSha}`

function getBuildSha(): string {
  if (process.env.BUILD_SHA) {
    return process.env.BUILD_SHA
  }

  try {
    return execSync('git rev-parse --short=12 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return 'unknown'
  }
}

function getBuildBranch(): string {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return 'unknown'
  }
}

function getBuildCommitMessage(): string {
  try {
    return execSync('git log -1 --pretty=%s', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return 'unknown'
  }
}

const publicModules = Object.fromEntries(
  Object.entries(config.modules).map(([id, moduleConfig]) => [
    id,
    moduleConfig.enabled ? moduleConfig : { enabled: false }
  ])
)

const publicPmConfig = {
  entities: config.entities,
  appShell: config.appShell,
  adminEnabled: config.admin.enabled,
  adminSectionsByRole: {
    master: config.getAdminSectionsForRole('master'),
    admin: config.getAdminSectionsForRole('admin'),
    editor: config.getAdminSectionsForRole('editor'),
    user: config.getAdminSectionsForRole('user')
  },
  features: config.features,
  modules: publicModules,
  locales: config.locales,
  defaultLocale: config.defaultLocale,
  defaultTheme: config.defaultTheme,
  sections: config.sections,
  colors: config.colors,
  logo: config.logo,
  footerMadeBy: config.footerMadeBy,
  settings: config.settings,
  settingGroups: config.settingGroups,
  headerContact: config.headerContact,
  hasWebsite: config.hasWebsite,
  hasApp: config.hasApp,
  hasAdmin: config.hasAdmin,
  hasLoginButton: config.hasLoginButton,
  isAppOnly: config.isAppOnly,
  isWebsiteOnly: config.isWebsiteOnly,
  isMultiLang: config.isMultiLang,
  hasThemeToggle: config.hasThemeToggle,
  useHeroParallax: config.useHeroParallax,
  useScrollytelling: config.useScrollytelling,
  has2FA: config.has2FA,
  useOnepager: config.useOnepager,
  useInteractiveHeader: config.useInteractiveHeader,
  headerFooterWidthMode: config.headerFooterWidthMode
}

export default defineNuxtConfig({
  extends: ['./pm-core'],
  compatibilityDate: '2025-07-15',
  // PM must not inherit noisy hook/debug behavior from shell-level DEBUG env vars.
  // Some environments export DEBUG=release, which Nuxt/std-env still treats as debug=true.
  debug: false,
  // DevTools are opt-in. PM should not spam browser console with Nuxt hook timing
  // and SSR dev logs during normal framework/project work.
  devtools: { enabled: false },

  features: {
    devLogs: false
  },

  // Serve static assets from project-root public/ directory
  // Nuxt 4 defaults dir.public to app/public/ relative to srcDir
  dir: {
    public: join(rootDir, 'public')
  },

  // CSS entry point - our custom CSS system
  css: ['~/assets/css/main.css'],

  // App head configuration
  app: {
    head: {
      // Viewport meta - includes viewport-fit=cover for iOS safe-area-inset support
      // Required for PWA and proper bottom nav handling with iOS notch/home indicator
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }
      ],
      // Favicons - generated via `npm run generate:favicons`
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }
      ]
    },
    // Page transitions (SPA mode only - disabled in onepager mode)
    // Transition name maps to CSS classes: page-{name}-enter-active, etc.
    ...(config.features.pageTransitions && !config.features.onepager
      ? {
          pageTransition: {
            name: `page-${config.features.pageTransitions}`,
            mode: 'out-in'
          }
        }
      : {})
  },

  // Modules
  modules: [
    ...(isTestEnv ? [] : ['@nuxtjs/color-mode']),
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    // Critical CSS inlining for faster FCP/LCP
    '@nuxtjs/critters',
    // PWA module - conditionally loaded based on config.features.pwa
    ...(config.features.pwa ? ['@vite-pwa/nuxt'] : [])
  ],

  // Critters configuration — inlines critical CSS, defers non-critical
  // preload: 'js-lazy' avoids onload event handlers (CSP-compatible)
  critters: {
    preload: 'js-lazy',
    pruneSource: true,
    inlineFonts: false,
    compress: true,
  },

  // PWA configuration (only applied when config.features.pwa is true)
  // Uses favicon assets generated via `npm run generate:favicons`
  ...(config.features.pwa
    ? {
        pwa: {
          registerType: 'autoUpdate',
          manifest: {
            name: 'Puppet Master',
            short_name: 'PM',
            description: 'Puppet Master Application',
            theme_color: config.colors.brand,
            background_color: config.colors.white,
            display: 'standalone',
            icons: [
              {
                src: '/favicon-192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: '/favicon-512.png',
                sizes: '512x512',
                type: 'image/png'
              },
              {
                src: '/favicon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
              }
            ]
          },
          workbox: {
            // Cache static assets
            globPatterns: ['**/*.{js,css,html,png,jpg,jpeg,svg,ico,woff,woff2}'],
            // Runtime caching for API calls
            runtimeCaching: []
          },
          client: {
            installPrompt: true,
            periodicSyncForUpdates: 3600 // Check for updates every hour
          },
          devOptions: {
            enabled: false, // Disable in dev by default (set true to test PWA locally)
            type: 'module'
          }
        }
      }
    : {}),

  // Color mode configuration
  // Uses defaultTheme from puppet-master.config.ts
  ...(isTestEnv
    ? {}
    : {
        colorMode: {
          preference: config.defaultTheme,
          fallback: config.defaultTheme === 'system' ? 'light' : config.defaultTheme,
          classSuffix: '',
          storageKey: 'pm-color-mode',
          storage: 'localStorage'
        }
      }),

  // i18n configuration
  // NOTE: Translations come from DATABASE via API, not per-locale files!
  // A single loader.ts handles ALL locales - no manual file creation needed
  // Fallbacks in fallbacks.ts provide minimal bootstrap translations
  i18n: {
    // Locales from config - ALL use the same loader.ts file
    // preload: true ensures translations are available during hydration
    locales: config.locales.map(l => ({ ...l, file: 'loader.ts', preload: true })),
    langDir: '.', // loader.ts is in i18n/ directory
    defaultLocale: config.defaultLocale,
    strategy: 'prefix_and_default',
    detectBrowserLanguage: {
      useCookie: false,
      fallbackLocale: config.defaultLocale,
      // alwaysRedirect: false - don't override user's explicit language selection
      // redirectOn: 'root' - only detect on first visit to root path
      alwaysRedirect: false,
      redirectOn: 'root'
    },
    // Bundle options.
    // Translations are loaded dynamically from the API/database at runtime,
    // so we must use the full Vue I18n runtime with the message compiler kept.
    bundle: {
      fullInstall: true,
      runtimeOnly: false,
      dropMessageCompiler: false
    },
    // Compilation options
    compilation: {
      strictMessage: true
      // Note: JIT mode is the default in vue-i18n@10+
    },
    // Vue I18n options
    vueI18n: './i18n/i18n.config.ts'
  },

  // PostCSS configuration
  // postcss-preset-env includes autoprefixer + 50+ plugins for modern CSS fallbacks
  postcss: {
    plugins: {
      'postcss-preset-env': {
        // Stage 2 = reasonable stability (default)
        // Stage 3 = more stable, fewer features
        stage: 2,
        // Require 2 browser implementations for extra stability
        minimumVendorImplementations: 2,
        // Enable specific features we use
        features: {
          'custom-media-queries': true, // @custom-media support
          'nesting-rules': true, // CSS nesting
          'color-mix': true, // color-mix() fallbacks
          'custom-properties': true // CSS variables fallback for older browsers
        },
        // Autoprefixer options
        autoprefixer: {
          flexbox: 'no-2009' // Don't generate old flexbox syntax
        }
      },
      // PurgeCSS - remove unused CSS for smaller bundle size
      // Only in production to speed up dev builds
      // Fixed paths for Nuxt 4 app directory structure (Comment 11)
      ...(process.env.NODE_ENV === 'production'
        ? {
            '@fullhuman/postcss-purgecss': {
              content: ['./app/**/*.vue', './app/**/*.ts'],
              // Preserve dynamic classes and CSS variables
              safelist: {
                standard: [
                  /^dark/,
                  /^light/,
                  /^page-/,
                  /^router-/,
                  /^nuxt-/,
                  /^v-/,
                  /^hamburger/,
                  /-enter/,
                  /-leave/,
                  /-active/,
                  /data-/
                ],
                // Preserve :lang() selectors for multi-language CSS rules
                deep: [/:lang/],
                // Keep CSS custom properties
                variables: [/^--/]
              },
              // Extract classes from Vue SFC
              defaultExtractor: (content: string) => {
                const contentWithoutStyleBlocks = content.replace(/<style[^]+?<\/style>/gi, '')
                return contentWithoutStyleBlocks.match(/[\w-/:]+(?<!:)/g) || []
              }
            }
          }
        : {})
    }
  },

  // Experimental features
  experimental: {
    // Note: inlineStyles was removed in Nuxt 4 - CSS is optimized automatically
    browserDevtoolsTiming: false
  },

  // Vite configuration
  vite: {
    resolve: {
      alias: {
        'gsap': join(rootDir, 'node_modules', 'gsap'),
      },
    },
    optimizeDeps: {
      include: ['gsap', 'gsap/DrawSVGPlugin', 'gsap/TextPlugin'],
    },
    ssr: {
      noExternal: ['gsap'],
    },
    build: {
      chunkSizeWarningLimit: 750,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('/node_modules/three/')) {
              return 'vendor-three'
            }

            if (id.includes('/node_modules/@sentry/')) {
              return 'vendor-sentry'
            }

            if (id.includes('/node_modules/gsap/')) {
              return 'vendor-gsap'
            }
          }
        }
      }
    },
    plugins: [
      Icons({
        compiler: 'vue3',
        autoInstall: true
      }),
      svgLoader()
    ]
  },

  // Nitro configuration
  nitro: {
    publicAssets: process.env.NODE_ENV === 'production'
      ? [
          {
            dir: optimizedImagesPublicDir,
            baseURL: '/images'
          }
        ]
      : [],
    // Generate precompressed static assets so production servers/Nitro can serve
    // smaller CSS/JS/font payloads without changing render order or causing FOUC.
    compressPublicAssets: {
      gzip: true,
      brotli: true
    },
    // Scheduled tasks (MED-02: Session cleanup)
    scheduledTasks: {
      // Run session cleanup every hour at minute 0
      '0 * * * *': ['cleanup-sessions']
    },
    // Experimental features required for scheduled tasks
    experimental: {
      tasks: true
    },
    // Route rules for caching static assets and security limits
    routeRules: {
      // SSR pages — incremental static regeneration. First request renders
      // server-side (full i18n support), subsequent requests served from cache.
      // Prerender is not used because the i18n messages are fetched async and
      // aren't available during static generation, resulting in raw i18n keys
      // visible in the output.
      '/': { isr: 3600 },
      '/en': { isr: 3600 },
      '/ru': { isr: 3600 },
      '/fr': { isr: 3600 },
      '/he': { isr: 3600 },
      // Static assets - long cache (1 year, immutable since they have hashed names)
      '/_nuxt/**': {
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      },
      // Favicons and static files
      '/favicon.*': {
        headers: {
          'Cache-Control': 'public, max-age=86400'
        }
      },
      '/og-image.png': {
        headers: {
          'Cache-Control': 'public, max-age=86400'
        }
      },
      '/og-image.*.png': {
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      },
      '/logos/**': {
        headers: {
          'Cache-Control': 'public, max-age=2592000'
        }
      },
      '/puppetmaster/**': {
        headers: {
          'Cache-Control': 'public, max-age=2592000'
        }
      },
      '/apple-touch-icon.png': {
        headers: {
          'Cache-Control': 'public, max-age=86400'
        }
      },
      // Optimized images (AVIF/WebP/pattern) - 30 days, revalidate
      '/images/**': {
        headers: {
          'Cache-Control': 'public, max-age=2592000, must-revalidate'
        }
      },
      // MadeBy logos - 30 days, same as /logos/
      '/madebylogos/**': {
        headers: {
          'Cache-Control': 'public, max-age=2592000, immutable'
        }
      }
      // Note: Body size limits for /api/setup/import-zip are enforced at the handler level
      // via Content-Length header check (first line of defense before body parsing)
    }
  },

  // Runtime config
  runtimeConfig: {
    appVersion,
    buildVersion,
    buildTimestamp,
    buildSha,
    buildBranch,
    buildCommitMessage,

    // Database
    databaseUrl: process.env.NUXT_DATABASE_URL || process.env.DATABASE_URL || './data/sqlite.db',

    // Email (SMTP)
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: process.env.SMTP_PORT || '465',
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    smtpFrom: process.env.SMTP_FROM || '',

    // External API (for dataSource.provider = 'api' or 'hybrid')
    apiBaseUrl: process.env.API_BASE_URL || '',
    apiClientId: process.env.API_CLIENT_ID || '',
    apiClientSecret: process.env.API_CLIENT_SECRET || '',
    apiTokenUrl: process.env.API_TOKEN_URL || '',
    apiJwtToken: process.env.API_JWT_TOKEN || '',
    apiKey: process.env.API_KEY || '',
    apiTokenRefreshBuffer: process.env.API_TOKEN_REFRESH_BUFFER || '300',

    // Redis (for distributed cache in multi-instance deployments)
    redisUrl: process.env.REDIS_URL || '',
    redisPrefix: process.env.REDIS_PREFIX || 'pm-cache:',

    // Local host monitoring source. The admin UI renders PM-native widgets.
    netdataEnabled: process.env.PM_MONITORING_NETDATA_ENABLED ?? 'true',
    netdataUrl: process.env.NETDATA_URL || 'http://127.0.0.1:19999',

    // Private PM ops agent. The agent is internal-only and owns host Docker access.
    opsAgentEnabled: process.env.PM_OPS_AGENT_ENABLED ?? 'false',
    opsAgentUrl: process.env.PM_OPS_AGENT_URL || 'http://127.0.0.1:3010',
    opsAgentToken: process.env.PM_OPS_AGENT_TOKEN || '',

    // Site domain (used for constructing URLs)
    siteDomain: process.env.SITE_DOMAIN || '',

    public: {
      pm: publicPmConfig,
      appVersion,
      buildVersion,
      buildTimestamp,
      buildSha,
      siteDomain: process.env.SITE_DOMAIN || '',
      // PM Mode - env var overrides config file for deploy/local runtime mode.
      pmMode: process.env.PM_MODE || config.pmMode || 'unconfigured',
      // External monitoring dashboard URL (constructed from subdomain + domain)
      uptimeKumaUrl:
        process.env.UPTIME_KUMA_SUBDOMAIN && process.env.SITE_DOMAIN
          ? `https://${process.env.UPTIME_KUMA_SUBDOMAIN}.${process.env.SITE_DOMAIN}`
          : ''
    }
  }
})
