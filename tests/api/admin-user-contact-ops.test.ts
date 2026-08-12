import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Database from 'better-sqlite3'
import { startTestServer, ApiClient, SEED_USER, type TestServerHandle } from './helpers/server'

/**
 * Live-server verification for the admin user ops (C1) and contacts (C5)
 * review changes:
 *   - PUT /api/admin/users/[id] accepts an optional password (policy-checked)
 *     and the new credential works afterwards
 *   - POST /api/admin/users/[id] { action: 'unlock' } clears the lockout fields
 *     and is audit-logged
 *   - PATCH /api/admin/contacts/[id] accepts BOTH read states (reversible)
 */

let server: TestServerHandle
let client: ApiClient

function readUserLock(id: number) {
  const db = new Database(server.dbPath)
  const row = db
    .prepare(
      'SELECT failed_login_attempts AS attempts, locked_until AS lockedUntil, last_failed_login AS lastFailed FROM users WHERE id = ?'
    )
    .get(id) as { attempts: number | null; lockedUntil: string | null; lastFailed: string | null }
  db.close()
  return row
}

beforeAll(async () => {
  server = await startTestServer()
  client = new ApiClient(server.baseUrl, server.origin)
  await client.get('/') // prime the CSRF cookie
  const login = await client.postJson('/api/auth/login', {
    email: SEED_USER.email,
    password: SEED_USER.password
  })
  expect(login.status).toBe(200)
}, 180_000)

afterAll(async () => {
  await server.stop()
}, 30_000)

describe('admin user update: password reset + unlock (review C1)', () => {
  let userId = 0
  const email = 'ops-test@example.com'
  const password = 'A!opsTest#Pass1'

  it('creates an editor user, resets its password via the update API, and the new credential works', async () => {
    const created = await client.postJson('/api/admin/users', {
      email,
      password,
      role: 'editor'
    })
    expect(created.status).toBe(200)
    const createdBody = (await created.json()) as { data?: { id?: number } }
    userId = createdBody.data?.id ?? 0
    expect(userId).toBeGreaterThan(0)

    // Reset the password through the UPDATE API (the new contract).
    const newPassword = 'B!opsTest#Pass2'
    const reset = await client.putJson(`/api/admin/users/${userId}`, { password: newPassword })
    expect(reset.status).toBe(200)

    // The old password must no longer work; the new one logs the editor in.
    const editorClient = new ApiClient(server.baseUrl, server.origin)
    await editorClient.get('/')
    const oldLogin = await editorClient.postJson('/api/auth/login', { email, password })
    expect(oldLogin.status).toBe(401)

    const newLogin = await editorClient.postJson('/api/auth/login', {
      email,
      password: newPassword
    })
    expect(newLogin.status).toBe(200)
  })

  it('unlocks a locked account and resets attempts/lock window/last failure', async () => {
    // Lock the account directly in the DB (5 failures → lockedUntil in future).
    {
      const db = new Database(server.dbPath)
      db.prepare(
        'UPDATE users SET failed_login_attempts = 5, locked_until = ?, last_failed_login = ? WHERE id = ?'
      ).run(new Date(Date.now() + 30 * 60 * 1000).toISOString(), new Date().toISOString(), userId)
      db.close()
    }
    const locked = readUserLock(userId)
    expect(locked.attempts).toBe(5)
    expect(locked.lockedUntil).toBeTruthy()

    const unlock = await client.postJson(`/api/admin/users/${userId}`, { action: 'unlock' })
    expect(unlock.status).toBe(200)
    const unlockBody = (await unlock.json()) as { data?: { unlocked?: boolean } }
    expect(unlockBody.data?.unlocked).toBe(true)

    const after = readUserLock(userId)
    expect(after.attempts).toBe(0)
    expect(after.lockedUntil).toBeNull()
    expect(after.lastFailed).toBeNull()

    // Both the reset and the unlock were audit-logged.
    const db = new Database(server.dbPath)
    const passwordChange = db
      .prepare(
        "SELECT action FROM audit_logs WHERE target_user_id = ? AND action = 'password_change'"
      )
      .all(userId) as Array<{ action: string }>
    const unlockEvent = db
      .prepare(
        "SELECT action FROM audit_logs WHERE target_user_id = ? AND action = 'account_unlocked'"
      )
      .all(userId) as Array<{ action: string }>
    db.close()
    expect(passwordChange.length).toBeGreaterThan(0)
    expect(unlockEvent.length).toBeGreaterThan(0)
  })
})

describe('contacts PATCH: reversible read state (review C5)', () => {
  it('marks a submission read and back to unread', async () => {
    // Seed a submission directly.
    let submissionId = 0
    {
      const db = new Database(server.dbPath)
      const result = db
        .prepare(
          'INSERT INTO contact_submissions (name, email, message, consent, read, created_at) VALUES (?, ?, ?, 1, 0, ?)'
        )
        .run('Review', 'review@example.com', 'Hello', new Date().toISOString())
      submissionId = Number(result.lastInsertRowid)
      db.close()
    }

    const markRead = await client.request(`/api/admin/contacts/${submissionId}`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': client.getCookie('pm-csrf') ?? ''
      },
      body: JSON.stringify({ read: true })
    })
    expect(markRead.status).toBe(200)
    const readBody = (await markRead.json()) as { data?: { read?: boolean } }
    expect(readBody.data?.read).toBe(true)

    // Reversible: mark it unread again (previously rejected by z.literal(true)).
    const markUnread = await client.request(`/api/admin/contacts/${submissionId}`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': client.getCookie('pm-csrf') ?? ''
      },
      body: JSON.stringify({ read: false })
    })
    expect(markUnread.status).toBe(200)
    const unreadBody = (await markUnread.json()) as { data?: { read?: boolean } }
    expect(unreadBody.data?.read).toBe(false)

    const db = new Database(server.dbPath)
    const row = db
      .prepare('SELECT read FROM contact_submissions WHERE id = ?')
      .get(submissionId) as { read: number }
    db.close()
    expect(row.read).toBe(0)
  })
})
