/**
 * Request-level test server harness (audit E-8 / N-11 API test gate).
 *
 * Spawns the REAL production server (node build/index.js — adapter-node
 * output) against a temporary SQLite database, so tests exercise the actual
 * route handlers, hooks.server.ts (session + CSRF), and page actions over
 * HTTP. The DB is migrated with the shipped migration runner and seeded with
 * the standard seed, mirroring the production bootstrap.
 *
 * Transport: the backend listens on a loopback HTTP port and is fronted by a
 * TLS-terminating proxy on the port tests connect to. The production cookie
 * settings (Secure/HttpOnly) are therefore exercised faithfully — the cookie
 * jar preserves cookie attributes and applies browser send rules (e.g. Secure
 * cookies are never resent over plain HTTP).
 */
import { spawn, execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import net from 'node:net'
import http from 'node:http'
import https from 'node:https'
import Database from 'better-sqlite3'
import { Agent, setGlobalDispatcher } from 'undici'

// The TLS cert is self-signed (generated per run for 127.0.0.1). Tests only
// talk to their own loopback server, so relax certificate validation for this
// process's outbound connections via the undici dispatcher (no global env).
setGlobalDispatcher(new Agent({ connect: { rejectUnauthorized: false } }))

export const REPO_ROOT = path.resolve(import.meta.dirname, '../../..')

const MIGRATE_SCRIPT = path.join(REPO_ROOT, 'scripts', 'docker-migrate.mjs')
const SEED_SCRIPT = path.join(REPO_ROOT, 'src', 'lib', 'server', 'db', 'seed.ts')
const SERVER_ENTRY = path.join(REPO_ROOT, 'build', 'index.js')
const MIGRATIONS_DIR = path.join(REPO_ROOT, 'drizzle')

/**
 * Seed credentials used by the test run.
 *
 * The seed no longer accepts reusable/default passwords: in configured
 * (PM_MODE=build) environments it FAILS FAST unless PM_ADMIN_*_PASSWORD env
 * vars are provided. These fixtures are generated per test run and injected
 * into the seed command below — they exist only in this throwaway database.
 */
function makeBootstrapPassword(prefix: string): string {
  return `${prefix}-${randomBytes(10).toString('hex')}`
}

export const SEED_USER = {
  email: 'master@example.com',
  password: makeBootstrapPassword('Master'),
  role: 'master'
}

const SEED_ADMIN_ENV = {
  PM_ADMIN_MASTER_EMAIL: SEED_USER.email,
  PM_ADMIN_MASTER_PASSWORD: SEED_USER.password,
  PM_ADMIN_ADMIN_EMAIL: 'admin@example.com',
  PM_ADMIN_ADMIN_PASSWORD: makeBootstrapPassword('Admin'),
  PM_ADMIN_USER_EMAIL: 'editor@example.com',
  PM_ADMIN_USER_PASSWORD: makeBootstrapPassword('Editor')
}

export interface TestServerHandle {
  /** HTTPS base URL of the running server. */
  baseUrl: string
  /** Origin header value SvelteKit expects for same-origin form posts. */
  origin: string
  /** Absolute path of the temporary SQLite database. */
  dbPath: string
  /** Stop the server and remove the temporary DB. */
  stop(): Promise<void>
}

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.unref()
    srv.on('error', reject)
    srv.listen(0, '127.0.0.1', () => {
      const address = srv.address()
      if (address && typeof address === 'object') {
        const port = address.port
        srv.close(() => resolve(port))
      } else {
        srv.close(() => reject(new Error('Could not allocate a free port')))
      }
    })
  })
}

function run(cmd: string, args: string[], env: NodeJS.ProcessEnv): void {
  execFileSync(cmd, args, { cwd: REPO_ROOT, env: { ...process.env, ...env }, stdio: 'pipe' })
}

/** Generate a throwaway self-signed certificate for 127.0.0.1. */
function generateSelfSignedCert(dir: string): { cert: string; key: string } {
  const certPath = path.join(dir, 'cert.pem')
  const keyPath = path.join(dir, 'key.pem')
  execFileSync(
    'openssl',
    [
      'req', '-x509', '-newkey', 'rsa:2048',
      '-keyout', keyPath, '-out', certPath,
      '-sha256', '-days', '1', '-nodes',
      '-subj', '/CN=127.0.0.1',
      '-addext', 'subjectAltName=IP:127.0.0.1'
    ],
    { cwd: dir, stdio: 'pipe' }
  )
  return { cert: readFileSync(certPath, 'utf8'), key: readFileSync(keyPath, 'utf8') }
}

/**
 * TLS terminator in front of the plain-HTTP backend. Rewrites the forwarded
 * Host / protocol so SvelteKit's request URL (and its origin check) matches
 * the https origin the test client uses.
 */
function startTlsProxy(
  publicPort: number,
  backendPort: number,
  cert: string,
  key: string
): Promise<https.Server> {
  const proxy = https.createServer({ cert, key }, (req, res) => {
    const forward = http.request(
      {
        host: '127.0.0.1',
        port: backendPort,
        path: req.url,
        method: req.method,
        headers: {
          ...req.headers,
          host: `127.0.0.1:${publicPort}`,
          'x-forwarded-proto': 'https',
          'x-forwarded-host': `127.0.0.1:${publicPort}`
        }
      },
      (upstream) => {
        const headers = { ...upstream.headers }
        delete headers.connection
        res.writeHead(upstream.statusCode ?? 502, headers)
        upstream.pipe(res)
      }
    )
    forward.on('error', (error) => {
      res.writeHead(502, { 'content-type': 'text/plain' })
      res.end(`proxy error: ${error.message}`)
    })
    req.pipe(forward)
  })
  return new Promise((resolve, reject) => {
    proxy.once('error', reject)
    proxy.listen(publicPort, '127.0.0.1', () => resolve(proxy))
  })
}

async function isHealthy(baseUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/api/health`)
    return res.ok
  } catch {
    // Server not up yet — typed false lets the caller retry (Rule D.13).
    return false
  }
}

async function waitForHealth(baseUrl: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await isHealthy(baseUrl)) return
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error(`Server at ${baseUrl} did not become healthy within ${timeoutMs}ms`)
}

/**
 * Build, migrate, seed, and start the production server against a fresh
 * temporary SQLite database. Call in beforeAll; `stop()` in afterAll.
 */
export async function startTestServer(): Promise<TestServerHandle> {
  if (!existsSync(SERVER_ENTRY)) {
    console.log('[api-test] build/ missing — running npm run build...')
    execFileSync('npm', ['run', 'build'], { cwd: REPO_ROOT, stdio: 'inherit' })
  }

  const tmpDir = mkdtempSync(path.join(tmpdir(), 'pm-api-test-'))
  const dbPath = path.join(tmpDir, 'sqlite.db')
  const encryptionKey = randomBytes(32).toString('hex')
  const backendPort = await getFreePort()
  const publicPort = await getFreePort()
  const baseUrl = `https://127.0.0.1:${publicPort}`
  const origin = baseUrl

  // 1. Apply migrations with the shipped runner (same contract as deploy).
  run(process.execPath, [MIGRATE_SCRIPT], {
    DATABASE_URL: dbPath,
    PM_MIGRATIONS_DIR: MIGRATIONS_DIR
  })

  // 2. Seed the standard data (master/admin/editor users, settings, roles).
  //    Admin bootstrap credentials are REQUIRED in configured environments —
  //    inject the per-run fixtures so the seed does not fail fast.
  run('npx', ['tsx', SEED_SCRIPT], { DATABASE_URL: dbPath, ...SEED_ADMIN_ENV })

  // 2b. Seeded accounts start with must_change_password = 1 (first-login
  //     hardening). Clear it so the request-level tests represent an operator
  //     who completed the forced change; the hardening flow itself is covered
  //     by the change-password endpoint tests.
  {
    const db = new Database(dbPath)
    db.prepare('UPDATE users SET must_change_password = 0').run()
    db.close()
  }

  // 3. Spawn the real adapter-node server against the temp DB (plain HTTP).
  const child = spawn(process.execPath, [SERVER_ENTRY], {
    cwd: REPO_ROOT,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      HOST: '127.0.0.1',
      PORT: String(backendPort),
      DATABASE_URL: dbPath,
      TOTP_ENCRYPTION_KEY: encryptionKey
    },
    stdio: ['ignore', 'pipe', 'pipe']
  })

  let logs = ''
  child.stdout?.on('data', (chunk) => { logs += String(chunk) })
  child.stderr?.on('data', (chunk) => { logs += String(chunk) })

  // 4. Terminate TLS in front of the backend so production cookie semantics
  //    (Secure cookies) are exercised over the transport tests use.
  const { cert, key } = generateSelfSignedCert(tmpDir)
  let tlsProxy: https.Server
  try {
    tlsProxy = await startTlsProxy(publicPort, backendPort, cert, key)
    await waitForHealth(baseUrl)
  } catch (error) {
    child.kill('SIGKILL')
    tlsProxy?.close()
    rmSync(tmpDir, { recursive: true, force: true })
    throw new Error(`${error instanceof Error ? error.message : String(error)}\nServer logs:\n${logs}`)
  }

  return {
    baseUrl,
    origin,
    dbPath,
    stop: async () => {
      tlsProxy.close()
      if (child.exitCode === null) {
        child.kill('SIGTERM')
        await new Promise<void>((resolve) => {
          child.once('exit', () => resolve())
          setTimeout(() => {
            if (child.exitCode === null) child.kill('SIGKILL')
            resolve()
          }, 5000)
        })
      }
      rmSync(tmpDir, { recursive: true, force: true })
    }
  }
}

export interface TestResponse {
  status: number
  headers: Headers
  bodyText: string
  json(): Promise<unknown>
}

/** One cookie as stored by the jar (attributes preserved per RFC 6265). */
interface StoredCookie {
  value: string
  secure: boolean
  httpOnly: boolean
  sameSite: string | null
  path: string
  expiresAt: number | null
}

/** Cookie store that applies the browser send rules (Secure over https, path match, expiry). */
class CookieJar {
  private readonly cookies = new Map<string, StoredCookie>()

  get(name: string): string | undefined {
    const cookie = this.cookies.get(name)
    if (!cookie) return undefined
    if (cookie.expiresAt !== null && cookie.expiresAt <= Date.now()) {
      this.cookies.delete(name)
      return undefined
    }
    return cookie.value
  }

  capture(setCookie: string): void {
    const [pair, ...rest] = setCookie.split(';')
    const eq = pair.indexOf('=')
    const name = pair.slice(0, eq).trim()
    const value = pair.slice(eq + 1).trim()

    const attrs = new Map<string, string>()
    for (const part of rest) {
      const trimmed = part.trim()
      const sep = trimmed.indexOf('=')
      const key = (sep === -1 ? trimmed : trimmed.slice(0, sep)).toLowerCase()
      const val = sep === -1 ? '' : trimmed.slice(sep + 1).trim()
      if (key) attrs.set(key, val)
    }

    // Expired/deleted cookies are removed from the store.
    const maxAge = attrs.get('max-age')
    const expires = attrs.get('expires')
    if (value === '' && (maxAge === '0' || (expires !== undefined && /^thu, 01 jan 1970/i.test(expires)))) {
      this.cookies.delete(name)
      return
    }

    let expiresAt: number | null = null
    if (maxAge !== undefined && maxAge !== '') {
      const seconds = Number(maxAge)
      expiresAt = Number.isFinite(seconds) ? Date.now() + seconds * 1000 : null
    } else if (expires !== undefined) {
      const parsed = Date.parse(expires)
      expiresAt = Number.isFinite(parsed) ? parsed : null
    }

    this.cookies.set(name, {
      value,
      secure: attrs.has('secure'),
      httpOnly: attrs.has('httponly'),
      sameSite: attrs.get('samesite') ?? null,
      path: attrs.get('path') ?? '/',
      expiresAt
    })
  }

  /** Cookie header for a request URL, applying RFC 6265 send rules. */
  headerFor(url: URL): string {
    const secureRequest = url.protocol === 'https:'
    const parts: string[] = []
    for (const [name, cookie] of this.cookies) {
      if (cookie.expiresAt !== null && cookie.expiresAt <= Date.now()) {
        this.cookies.delete(name)
        continue
      }
      // Browsers never attach Secure cookies to plain-HTTP requests.
      if (cookie.secure && !secureRequest) continue
      // Path-match (RFC 6265 §5.1.4 prefix match).
      const cookiePath = cookie.path || '/'
      const prefix = cookiePath.endsWith('/') ? cookiePath : `${cookiePath}/`
      const pathMatches = url.pathname === cookiePath || url.pathname.startsWith(prefix)
      if (!pathMatches) continue
      parts.push(`${name}=${cookie.value}`)
    }
    return parts.join('; ')
  }
}

/** Minimal cookie-jarring fetch client mirroring browser behavior. */
export class ApiClient {
  private readonly jar = new CookieJar()

  constructor(
    private readonly baseUrl: string,
    private readonly origin: string
  ) {}

  getCookie(name: string): string | undefined {
    return this.jar.get(name)
  }

  private captureCookies(headers: Headers): void {
    for (const setCookie of headers.getSetCookie?.() ?? []) {
      this.jar.capture(setCookie)
    }
  }

  /** Raw request with automatic cookie handling (caller controls CSRF). */
  async request(path: string, init: RequestInit = {}): Promise<TestResponse> {
    const headers = new Headers(init.headers)
    const url = new URL(`${this.baseUrl}${path}`)
    const cookieHeader = this.jar.headerFor(url)
    if (cookieHeader) headers.set('cookie', cookieHeader)
    const res = await fetch(url, { ...init, headers, redirect: 'manual' })
    this.captureCookies(res.headers)
    const bodyText = await res.text()
    return {
      status: res.status,
      headers: res.headers,
      bodyText,
      json: async () => JSON.parse(bodyText)
    }
  }

  async get(path: string, init: RequestInit = {}): Promise<TestResponse> {
    return this.request(path, { ...init, method: 'GET' })
  }

  /** JSON POST with the X-CSRF-Token header (API contract). */
  async postJson(path: string, body: unknown, options: { csrf?: boolean } = {}): Promise<TestResponse> {
    const headers = new Headers({ 'content-type': 'application/json' })
    if (options.csrf !== false) {
      const token = this.getCookie('pm-csrf')
      if (token) headers.set('x-csrf-token', token)
    }
    return this.request(path, { method: 'POST', headers, body: JSON.stringify(body) })
  }

  /** urlencoded form POST with the `_csrf` field (page-action contract). */
  async postForm(path: string, fields: Record<string, string>, options: { csrf?: boolean } = {}): Promise<TestResponse> {
    const params = new URLSearchParams(fields)
    if (options.csrf !== false) {
      const token = this.getCookie('pm-csrf')
      if (token) params.set('_csrf', token)
    }
    const headers = new Headers({
      'content-type': 'application/x-www-form-urlencoded',
      origin: this.origin
    })
    return this.request(path, { method: 'POST', headers, body: params.toString() })
  }

  /** JSON PUT with the X-CSRF-Token header (API contract). */
  async putJson(path: string, body: unknown, options: { csrf?: boolean } = {}): Promise<TestResponse> {
    const headers = new Headers({ 'content-type': 'application/json' })
    if (options.csrf !== false) {
      const token = this.getCookie('pm-csrf')
      if (token) headers.set('x-csrf-token', token)
    }
    return this.request(path, { method: 'PUT', headers, body: JSON.stringify(body) })
  }
}
