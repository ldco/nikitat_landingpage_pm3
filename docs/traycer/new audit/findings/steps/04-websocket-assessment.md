# Step 04 — WebSocket support: port or document polling as permanent

> **Phase:** Immediate (Critical) | **Findings:** CF-6 | **Severity:** Critical-Functional

## What this step is

PM2 shipped a full WebSocket hub (`ws.ts`, ~216 lines) with auth, room subscriptions, and message broadcasting. PM3 has no WebSocket support — the admin unread-count badge polls via 30s fetch. This step decides the fate of real-time features: either port the WS hub to SvelteKit's custom-server adapter, or explicitly accept polling as the permanent architecture.

## What we are doing

1. **Investigate:** Read PM2's `ws.ts` + client integration and PM3's current polling implementation (admin unread count).
2. **Decide:** Choose one of two paths (recommended: port to a minimal WS hub, because real-time admin notifications are a core PM2 feature).
3. **Implement (if porting):** Attach a WebSocket server to the SvelteKit adapter-node custom server; mirror auth, room subscription, and broadcast semantics; update the admin client to consume the WS endpoint with graceful polling fallback.
4. **If documenting:** Add an architecture note explaining polling is intentional, and remove the "missing capability" ambiguity.

## Why

- This is the only Critical-Functional framework gap that is a **missing platform capability** (not a config choice).
- The admin currently gets stale unread counts and has no path to live notifications.
- `adapter-node` supports a custom server (`src/hooks.server.ts` + `server.js` entry) that can mount a `ws` server — the port is feasible.
- The decision must be explicit: an undocumented "we poll" is a trap for future agents that assume WebSocket exists.

## Plan

### Task 1: Investigate PM2 WS implementation

- **Files:** `app-nuxt/server/utils/ws.ts` (or wherever PM2's hub lives), PM2 admin client wiring
- **Change:** Read-only; document auth flow, room model, broadcast API, and client protocol.

### Task 2: Decide and record the decision

- **File:** `docs/traycer/new audit/findings/` or `docs/architecture/` — add a short ADR.
- **Change:** Record decision: port (recommended) or keep polling (accepted limitation).

### Task 3 (if porting): Implement WS server

- **Files:** `src/hooks.server.ts` (or a new `src/lib/server/ws.ts`), `svelte.config.js` (adapter options if needed)
- **Change:** Mount a `ws`/`@fastify/websocket`-style server on the adapter-node HTTP server; reuse session auth to authenticate connections; implement the minimal room/broadcast API from PM2.

### Task 4 (if porting): Update admin client

- **Files:** admin layout/store where unread count is polled
- **Change:** Subscribe via WS with automatic fallback to the existing 30s polling on connection failure.

## Verification

- [ ] Decision ADR written and linked from the consolidated report
- [ ] (If porting) `npm run check`, `npm run lint`, `npm test` pass
- [ ] (If porting) Two browser sessions: a state change in one reflects live in the other without polling
- [ ] (If porting) WS auth rejects unauthenticated connections
- [ ] (If documenting) README/AGENTS note that polling is the permanent approach

## Notes / Risks

- If porting is deferred, the polling path already exists and works — do not remove it as part of this step.
- WS adds an always-on connection; ensure `wss` (TLS) behind the reverse proxy in production.
