import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Database from 'better-sqlite3'
import { startTestServer, ApiClient, SEED_USER, type TestServerHandle } from './helpers/server'

/**
 * PM v2 parity regression (review): admins can manage NON-master users but
 * never master accounts.
 *
 *   - ADMIN_CONFIG.system.users.roles includes 'admin' and the built-in admin
 *     role grants users: true, so an admin reaches the user management page.
 *   - The page actions keep the master guard: creating/updating/deleting a
 *     master account as an admin is rejected.
 *
 * SvelteKit form actions answer HTTP 200 with a serialized result — the
 * success/denial is asserted on the body (`type: 'redirect'`/`type:
 * 'failure'` + `status`), not the HTTP status.
 */

let server: TestServerHandle
let client: ApiClient
let adminClient: ApiClient

const stamp = Date.now()
const ADMIN_EMAIL = `admin-${stamp}@example.com`
const ADMIN_PASSWORD = `Admin-${stamp}-z!9Q`
const EDITOR_EMAIL = `editor-${stamp}@example.com`

function userIdByEmail(email: string): number {
  const db = new Database(server.dbPath, { readonly: true })
  try {
    const row = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as
      | { id: number }
      | undefined
    return row?.id ?? -1
  } finally {
    db.close()
  }
}

async function loginAs(email: string, password: string): Promise<ApiClient> {
  const c = new ApiClient(server.baseUrl, server.origin)
  await c.get('/') // prime the double-submit CSRF cookie
  const res = await c.postJson('/api/auth/login', { email, password })
  expect(res.status).toBe(200)
  return c
}

beforeAll(async () => {
  server = await startTestServer()
  client = await loginAs(SEED_USER.email, SEED_USER.password)

  // As master, create an admin account (the helper does not expose the
  // seeded admin password, so the test bootstraps its own).
  const create = await client.postForm('/admin/users?/create', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    name: 'Test Admin',
    role: 'admin'
  })
  const createBody = (await create.json()) as { type?: string; status?: number }
  expect(createBody.type).toBe('redirect')
  expect(createBody.status).toBe(303)
}, 180_000)

afterAll(async () => {
  await server.stop()
}, 30_000)

describe('admin user management — non-master users yes, master accounts no', () => {
  it('admin can load the user management page', async () => {
    adminClient = await loginAs(ADMIN_EMAIL, ADMIN_PASSWORD)
    const res = await adminClient.get('/admin/users')
    expect(res.status).toBe(200)
  })

  it('admin can create a non-master (editor) user', async () => {
    const res = await adminClient.postForm('/admin/users?/create', {
      email: EDITOR_EMAIL,
      password: `Editor-${stamp}-k#2P`,
      name: 'Test Editor',
      role: 'editor'
    })
    const body = (await res.json()) as { type?: string; status?: number }
    expect(body.type).toBe('redirect')
    expect(body.status).toBe(303)
    expect(userIdByEmail(EDITOR_EMAIL)).toBeGreaterThan(0)
  })

  it('admin can update a non-master user', async () => {
    const editorId = userIdByEmail(EDITOR_EMAIL)
    const res = await adminClient.postForm('/admin/users?/update', {
      id: String(editorId),
      email: EDITOR_EMAIL,
      name: 'Renamed Editor',
      role: 'editor'
    })
    const body = (await res.json()) as { type?: string; status?: number }
    expect(body.type).toBe('redirect')
    expect(body.status).toBe(303)
  })

  it('admin can delete a non-master user', async () => {
    const editorId = userIdByEmail(EDITOR_EMAIL)
    const res = await adminClient.postForm('/admin/users?/delete', {
      id: String(editorId)
    })
    const body = (await res.json()) as { type?: string; status?: number }
    expect(body.type).toBe('redirect')
    expect(body.status).toBe(303)
    expect(userIdByEmail(EDITOR_EMAIL)).toBe(-1)
  })

  it('admin cannot create a master account', async () => {
    const res = await adminClient.postForm('/admin/users?/create', {
      email: `new-master-${stamp}@example.com`,
      password: `Master-${stamp}-q#7R`,
      name: 'Illegal Master',
      role: 'master'
    })
    const body = (await res.json()) as { type?: string; status?: number }
    expect(body.type).toBe('failure')
    expect(body.status).toBe(403)
    expect(userIdByEmail(`new-master-${stamp}@example.com`)).toBe(-1)
  })

  it('admin cannot promote a non-master user to master', async () => {
    const res = await adminClient.postForm('/admin/users?/create', {
      email: `promote-${stamp}@example.com`,
      password: `Promote-${stamp}-v#3M`,
      name: 'Promote Target',
      role: 'editor'
    })
    const createBody = (await res.json()) as { type?: string; status?: number }
    expect(createBody.type).toBe('redirect')
    const targetId = userIdByEmail(`promote-${stamp}@example.com`)
    expect(targetId).toBeGreaterThan(0)

    const promote = await adminClient.postForm('/admin/users?/update', {
      id: String(targetId),
      email: `promote-${stamp}@example.com`,
      name: 'Promote Target',
      role: 'master'
    })
    const promoteBody = (await promote.json()) as { type?: string; status?: number }
    expect(promoteBody.type).toBe('failure')
    expect(promoteBody.status).toBe(403)
  })

  it('admin cannot update a master account', async () => {
    const masterId = userIdByEmail(SEED_USER.email)
    expect(masterId).toBeGreaterThan(0)
    const res = await adminClient.postForm('/admin/users?/update', {
      id: String(masterId),
      email: SEED_USER.email,
      name: 'Hijacked Master',
      role: 'admin'
    })
    const body = (await res.json()) as { type?: string; status?: number }
    expect(body.type).toBe('failure')
    expect(body.status).toBe(403)
  })

  it('admin cannot delete a master account', async () => {
    const masterId = userIdByEmail(SEED_USER.email)
    const res = await adminClient.postForm('/admin/users?/delete', {
      id: String(masterId)
    })
    const body = (await res.json()) as { type?: string; status?: number }
    expect(body.type).toBe('failure')
    expect(body.status).toBe(403)
    expect(userIdByEmail(SEED_USER.email)).toBeGreaterThan(0)
  })

  it('master can still manage master accounts', async () => {
    // Self-edits now allow non-privilege fields, but role changes on the
    // actor's OWN account are rejected — so the master manages a SECOND
    // master account for a role-bearing update.
    const secondMasterEmail = `second-master-${stamp}@example.com`
    const created = await client.postForm('/admin/users?/create', {
      email: secondMasterEmail,
      password: `SecondMaster-${stamp}-p#4K`,
      name: 'Second Master',
      role: 'master'
    })
    const createdBody = (await created.json()) as { type?: string; status?: number }
    expect(createdBody.type).toBe('redirect')
    const secondMasterId = userIdByEmail(secondMasterEmail)
    expect(secondMasterId).toBeGreaterThan(0)

    const res = await client.postForm('/admin/users?/update', {
      id: String(secondMasterId),
      email: secondMasterEmail,
      name: 'Renamed Master',
      role: 'master'
    })
    const body = (await res.json()) as { type?: string; status?: number }
    expect(body.type).toBe('redirect')
    expect(body.status).toBe(303)
  })

  it('self-edit allows non-privilege fields but rejects a self-role change', async () => {
    const masterId = userIdByEmail(SEED_USER.email)
    expect(masterId).toBeGreaterThan(0)

    // Editing your OWN account for non-privilege fields (name/email) succeeds.
    const selfEdit = await client.postForm('/admin/users?/update', {
      id: String(masterId),
      email: SEED_USER.email,
      name: 'Self Renamed Master',
      role: 'master'
    })
    const selfEditBody = (await selfEdit.json()) as { type?: string; status?: number }
    expect(selfEditBody.type).toBe('redirect')
    expect(selfEditBody.status).toBe(303)

    // Self-demotion (or any self-role change) is rejected with a field error.
    const selfDemote = await client.postForm('/admin/users?/update', {
      id: String(masterId),
      email: SEED_USER.email,
      name: 'Self Renamed Master',
      role: 'admin'
    })
    const selfDemoteBody = (await selfDemote.json()) as {
      type?: string
      status?: number
      data?: unknown
    }
    expect(selfDemoteBody.type).toBe('failure')
    expect(selfDemoteBody.status).toBe(400)
    // The fail payload is devalue-serialized in the action result — the role
    // field error must reference the self-role-change key.
    expect(String(selfDemoteBody.data ?? '')).toContain(
      'apiErrors.admin.users.selfRoleChange'
    )
  })

  it('custom-role self-edit accepts the unchanged role but rejects a real role change', async () => {
    // The legacy users.role column stores 'editor' for custom roles while the
    // identity lives in roleId — the self-edit guard must compare the roles-
    // table identity so an unchanged custom role resubmit is accepted.
    const slug = `designer-${stamp}`

    // 1. Create a custom role whose permissions allow the users page.
    const createRole = await client.postForm('/admin/roles?/create', {
      name: 'Designer',
      slug,
      level: '10',
      color: 'secondary',
      perm_users: 'on'
    })
    const createRoleBody = (await createRole.json()) as { type?: string; status?: number }
    expect(createRoleBody.type).toBe('redirect')

    // 2. Create a user holding that custom role (as master).
    const customEmail = `custom-${stamp}@example.com`
    const customPassword = `Custom-${stamp}-w#5T`
    const created = await client.postForm('/admin/users?/create', {
      email: customEmail,
      password: customPassword,
      name: 'Custom Role User',
      role: slug
    })
    const createdBody = (await created.json()) as { type?: string; status?: number }
    expect(createdBody.type).toBe('redirect')
    const customId = userIdByEmail(customEmail)
    expect(customId).toBeGreaterThan(0)

    // 3. The seeded hardening flag must be cleared for the new account to use
    //    the admin surface (the helper only clears it for the seeded users).
    {
      const db = new Database(server.dbPath)
      db.prepare('UPDATE users SET must_change_password = 0 WHERE id = ?').run(customId)
      db.close()
    }

    // 4. Self-edit with the UNCHANGED custom role slug succeeds (this was the
    //    regression: persist.role fell back to 'editor' and never equaled the
    //    effective custom slug).
    const customClient = await loginAs(customEmail, customPassword)
    const selfEdit = await customClient.postForm('/admin/users?/update', {
      id: String(customId),
      email: customEmail,
      name: 'Self Renamed Custom',
      role: slug
    })
    const selfEditBody = (await selfEdit.json()) as { type?: string; status?: number }
    expect(selfEditBody.type).toBe('redirect')
    expect(selfEditBody.status).toBe(303)

    // 5. A REAL self-role change (to a different identity) is still rejected.
    const selfChange = await customClient.postForm('/admin/users?/update', {
      id: String(customId),
      email: customEmail,
      name: 'Self Renamed Custom',
      role: 'editor'
    })
    const selfChangeBody = (await selfChange.json()) as {
      type?: string
      status?: number
      data?: unknown
    }
    expect(selfChangeBody.type).toBe('failure')
    expect(selfChangeBody.status).toBe(400)
    expect(String(selfChangeBody.data ?? '')).toContain(
      'apiErrors.admin.users.selfRoleChange'
    )
  })
})
