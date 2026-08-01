/**
 * GET /api/docs/openapi.json
 *
 * OpenAPI 3.1 spec for the public API.
 */
import { json } from '@sveltejs/kit'
import type { RequestEvent } from '@sveltejs/kit'

export function GET(_event: RequestEvent) {
  const spec = {
    openapi: '3.1.0',
    info: {
      title: 'Puppet Master API',
      version: '1.0.0',
      description: 'Public and admin API for Puppet Master sites'
    },
    servers: [{ url: '/' }],
    paths: {
      '/api/health': {
        get: {
          summary: 'Health check',
          responses: { '200': { description: 'Service healthy' } }
        }
      },
      '/api/settings': {
        get: {
          summary: 'Public site settings',
          responses: { '200': { description: 'Key-value settings map' } }
        }
      },
      '/api/features': {
        get: {
          summary: 'Published feature items',
          responses: { '200': { description: 'Feature list' } }
        }
      },
      '/api/faq': {
        get: {
          summary: 'Published FAQ items',
          responses: { '200': { description: 'FAQ list' } }
        }
      },
      '/api/pricing': {
        get: {
          summary: 'Published pricing tiers',
          responses: { '200': { description: 'Pricing list' } }
        }
      },
      '/api/portfolios': {
        get: {
          summary: 'Published portfolios',
          responses: { '200': { description: 'Portfolio list' } }
        }
      },
      '/api/contact/submit': {
        post: {
          summary: 'Submit contact form',
          requestBody: {
            content: { 'application/json': { schema: { type: 'object' } } }
          },
          responses: { '200': { description: 'Submission accepted' } }
        }
      },
      '/api/auth/login': {
        post: {
          summary: 'Login (CSRF exempt)',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' }
                  },
                  required: ['email', 'password']
                }
              }
            }
          },
          responses: { '200': { description: 'Session created' } }
        }
      },
      '/api/upload/image': {
        post: {
          summary: 'Upload image (admin)',
          security: [{ cookieAuth: [] }],
          requestBody: {
            content: { 'multipart/form-data': { schema: { type: 'object', properties: { image: { type: 'string', format: 'binary' } } } } }
          },
          responses: { '200': { description: 'Image uploaded' } }
        }
      }
    },
    components: {
      securitySchemes: {
        cookieAuth: { type: 'apiKey', in: 'cookie', name: 'pm-session' }
      }
    }
  }
  return json(spec)
}
