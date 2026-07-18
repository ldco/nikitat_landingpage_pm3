/**
 * Chrome DevTools probes this well-known path in some environments.
 *
 * If it falls through to the Nuxt app shell, Vue Router logs a noisy
 * "No match found" warning in the console. Returning a tiny JSON document
 * here terminates the request at the server boundary and keeps the client
 * router out of it.
 */
export default defineEventHandler(event => {
  setHeader(event, 'Content-Type', 'application/json; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600')

  return {}
})
