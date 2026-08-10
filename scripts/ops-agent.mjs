import fs from 'node:fs'
import http from 'node:http'
import net from 'node:net'
import path from 'node:path'
import { Buffer } from 'node:buffer'
import { createRequire } from 'node:module'
import { URL } from 'node:url'

// Resolve better-sqlite3 from the image's shipped package.json + node_modules
// (fall back to the repo root when run outside the container).
const runtimeRequire = createRequire(fs.existsSync('/app/package.json') ? '/app/package.json' : new URL('../package.json', import.meta.url).pathname)
const Database = runtimeRequire('better-sqlite3')

const port = Number(process.env.PM_OPS_AGENT_PORT || 3010)
const token = process.env.PM_OPS_AGENT_TOKEN || ''
const appContainer = process.env.PM_APP_CONTAINER_NAME || 'pm-app'
const traefikContainer = process.env.TRAEFIK_CONTAINER_NAME || 'pm-traefik'
const registryContainer = process.env.PM_REGISTRY_CONTAINER_NAME || 'pm-registry'
const dbPath = process.env.DATABASE_URL || '/app/data/sqlite.db'
const backupDir = process.env.PM_BACKUP_DIR || '/app/backups'
const uploadDir = process.env.UPLOAD_DIR || '/app/uploads'
const dockerSocket = process.env.PM_DOCKER_SOCKET || '/var/run/docker.sock'

const actionDefinitions = {
  'db-integrity': { label: 'Check database integrity', dangerous: false },
  'db-backup': { label: 'Create database backup', dangerous: false },
  'restart-app': { label: 'Restart app container', dangerous: true },
  'restart-traefik': { label: 'Restart Traefik container', dangerous: true }
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' })
  response.end(JSON.stringify(payload))
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = []
    request.on('data', chunk => chunks.push(chunk))
    request.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      if (!raw) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(raw))
      } catch (error) {
        reject(error)
      }
    })
    request.on('error', reject)
  })
}

function requireAuth(request, response) {
  if (!token) {
    sendJson(response, 503, { success: false, error: 'PM_OPS_AGENT_TOKEN is not configured' })
    return false
  }

  if (request.headers.authorization !== `Bearer ${token}`) {
    sendJson(response, 401, { success: false, error: 'Unauthorized' })
    return false
  }

  return true
}

function dockerRequest(method, endpoint, timeoutMs = 5000) {
  return dockerRequestBuffer(method, endpoint, timeoutMs).then(buffer => buffer.toString('utf8'))
}

function dockerRequestBuffer(method, endpoint, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const request = http.request(
      {
        socketPath: dockerSocket,
        path: endpoint,
        method
      },
      response => {
        const chunks = []
        response.on('data', chunk => chunks.push(chunk))
        response.on('end', () => {
          const body = Buffer.concat(chunks)
          if (response.statusCode && response.statusCode >= 400) {
            reject(new Error(body.toString('utf8') || `Docker API returned HTTP ${response.statusCode}`))
            return
          }
          resolve(body)
        })
      }
    )
    request.on('error', reject)
    request.setTimeout(timeoutMs, () => {
      request.destroy(new Error(`Docker API timeout for ${endpoint}`))
    })
    request.end()
  })
}

async function dockerJson(method, endpoint) {
  const body = await dockerRequest(method, endpoint)
  return body ? JSON.parse(body) : null
}

async function getContainer(name) {
  const containers = await dockerJson('GET', `/containers/json?all=1&filters=${encodeURIComponent(JSON.stringify({ name: [name] }))}`)
  const container = Array.isArray(containers)
    ? containers.find(item => item.Names?.some(containerName => containerName === `/${name}`))
    : null
  if (!container) return null

  const details = await dockerJson('GET', `/containers/${encodeURIComponent(name)}/json`)
  return {
    name,
    id: container.Id,
    image: container.Image,
    state: container.State,
    status: container.Status,
    health: details?.State?.Health?.Status || null,
    restartCount: details?.RestartCount ?? null,
    startedAt: details?.State?.StartedAt || null
  }
}

async function getDockerDisk() {
  const data = await dockerJson('GET', '/system/df')
  const layerSize = sumSize(data?.LayersSize)
  const imageSize = Array.isArray(data?.Images) ? data.Images.reduce((sum, image) => sum + sumSize(image.Size), 0) : 0
  const volumeSize = Array.isArray(data?.Volumes) ? data.Volumes.reduce((sum, volume) => sum + sumSize(volume.UsageData?.Size), 0) : 0
  return {
    layerBytes: layerSize,
    imageBytes: imageSize,
    volumeBytes: volumeSize,
    images: Array.isArray(data?.Images) ? data.Images.length : 0,
    containers: Array.isArray(data?.Containers) ? data.Containers.length : 0,
    volumes: Array.isArray(data?.Volumes) ? data.Volumes.length : 0
  }
}

async function getDockerDiskSafe() {
  try {
    return await getDockerDisk()
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      layerBytes: 0,
      imageBytes: 0,
      volumeBytes: 0,
      images: 0,
      containers: 0,
      volumes: 0
    }
  }
}

function sumSize(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function pathStatus(targetPath) {
  try {
    const stat = fs.statSync(targetPath)
    fs.accessSync(targetPath, fs.constants.R_OK | fs.constants.W_OK)
    return {
      path: targetPath,
      exists: true,
      writable: true,
      type: stat.isDirectory() ? 'directory' : 'file',
      sizeBytes: stat.size
    }
  } catch (error) {
    return {
      path: targetPath,
      exists: fs.existsSync(targetPath),
      writable: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

function migrationStatus() {
  try {
    const migrationsDir = '/app/drizzle'
    const journal = JSON.parse(fs.readFileSync(path.join(migrationsDir, 'meta/_journal.json'), 'utf8'))
    const db = new Database(dbPath, { readonly: true, fileMustExist: true })
    const rows = db.prepare('SELECT count(*) AS count, max(created_at) AS lastCreatedAt FROM "__drizzle_migrations"').get()
    db.close()
    return {
      expected: Array.isArray(journal.entries) ? journal.entries.length : 0,
      applied: rows?.count || 0,
      pending: Math.max(0, (journal.entries?.length || 0) - (rows?.count || 0)),
      lastCreatedAt: rows?.lastCreatedAt || null
    }
  } catch (error) {
    return {
      expected: null,
      applied: null,
      pending: null,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

function integrityCheck() {
  const db = new Database(dbPath, { readonly: true, fileMustExist: true })
  try {
    const rows = db.prepare('PRAGMA integrity_check').all()
    return {
      ok: rows.length === 1 && Object.values(rows[0] || {})[0] === 'ok',
      rows
    }
  } finally {
    db.close()
  }
}

async function buildSummary() {
  return {
    timestamp: new Date().toISOString(),
    agent: {
      host: process.env.HOSTNAME || 'ops-agent',
      dockerSocket: fs.existsSync(dockerSocket),
      actions: Object.entries(actionDefinitions).map(([id, definition]) => ({ id, ...definition }))
    },
    containers: [
      await getContainer(appContainer),
      await getContainer(traefikContainer),
      await getContainer(registryContainer)
    ].filter(Boolean),
    dockerDisk: await getDockerDiskSafe(),
    database: {
      file: pathStatus(dbPath),
      backupDir: pathStatus(backupDir),
      migrations: migrationStatus()
    },
    storage: {
      uploads: pathStatus(uploadDir),
      temp: pathStatus('/app/data/temp')
    }
  }
}

async function getLogs(url) {
  const container = url.searchParams.get('container') || 'app'
  const tail = Math.min(Math.max(Number(url.searchParams.get('tail') || 200), 1), 500)
  const name = container === 'traefik' ? traefikContainer : appContainer
  const rawOutput = await dockerRequestBuffer('GET', `/containers/${encodeURIComponent(name)}/logs?stdout=1&stderr=1&tail=${tail}&timestamps=1`)
  const output = decodeDockerLogs(rawOutput)
  return { container, name, output: output || '(no logs)' }
}

function decodeDockerLogs(buffer) {
  const chunks = []
  let offset = 0
  while (offset + 8 <= buffer.length) {
    const streamType = buffer[offset]
    const size = buffer.readUInt32BE(offset + 4)
    if (![1, 2].includes(streamType) || size < 0 || offset + 8 + size > buffer.length) {
      return buffer.toString('utf8')
    }
    chunks.push(buffer.subarray(offset + 8, offset + 8 + size))
    offset += 8 + size
  }
  if (offset < buffer.length) chunks.push(buffer.subarray(offset))
  return Buffer.concat(chunks).toString('utf8')
}

async function runAction(action) {
  if (action === 'db-integrity') {
    return { action, result: integrityCheck() }
  }

  if (action === 'db-backup') {
    fs.mkdirSync(backupDir, { recursive: true })
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+$/, 'Z')
    const destination = path.join(backupDir, `sqlite-${stamp}.db`)
    const db = new Database(dbPath, { readonly: true, fileMustExist: true })
    try {
      await db.backup(destination)
      return { action, result: { path: destination, sizeBytes: fs.statSync(destination).size } }
    } finally {
      db.close()
    }
  }

  if (action === 'restart-app') {
    await dockerRequest('POST', `/containers/${encodeURIComponent(appContainer)}/restart?t=10`)
    return { action, result: { container: appContainer, restarted: true } }
  }

  if (action === 'restart-traefik') {
    await dockerRequest('POST', `/containers/${encodeURIComponent(traefikContainer)}/restart?t=10`)
    return { action, result: { container: traefikContainer, restarted: true } }
  }

  throw new Error(`Unsupported action: ${action}`)
}

const server = http.createServer(async (request, response) => {
  try {
    if (!requireAuth(request, response)) return

    const url = new URL(request.url || '/', 'http://ops-agent.local')
    if (request.method === 'GET' && url.pathname === '/summary') {
      sendJson(response, 200, { success: true, data: await buildSummary() })
      return
    }
    if (request.method === 'GET' && url.pathname === '/logs') {
      sendJson(response, 200, { success: true, data: await getLogs(url) })
      return
    }
    if (request.method === 'POST' && url.pathname === '/actions') {
      const body = await readBody(request)
      sendJson(response, 200, { success: true, data: await runAction(String(body.action || '')) })
      return
    }

    sendJson(response, 404, { success: false, error: 'Not found' })
  } catch (error) {
    sendJson(response, 500, {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

server.listen(port, '0.0.0.0', () => {
  console.log(`[ops-agent] listening on ${port}`)
})

server.on('error', error => {
  if (error instanceof Error && 'code' in error && error.code === 'EADDRINUSE') {
    console.error(`[ops-agent] port ${port} is already in use`)
  } else if (error instanceof Error && 'code' in error && error.code === 'EACCES') {
    console.error(`[ops-agent] cannot bind to port ${port}`)
  } else if (error instanceof Error && error.message.includes('socket')) {
    console.error(`[ops-agent] Docker socket error: ${error.message}`)
  } else {
    console.error(error)
  }
  process.exit(1)
})

process.on('SIGTERM', () => server.close(() => process.exit(0)))
process.on('SIGINT', () => server.close(() => process.exit(0)))

if (!fs.existsSync(dockerSocket)) {
  console.warn(`[ops-agent] Docker socket not found at ${dockerSocket}`)
}

if (!token) {
  console.warn('[ops-agent] PM_OPS_AGENT_TOKEN is not configured; API will reject requests')
}

net.connect({ path: dockerSocket }).on('error', () => {
  console.warn(`[ops-agent] Docker socket is not currently reachable at ${dockerSocket}`)
}).end()
