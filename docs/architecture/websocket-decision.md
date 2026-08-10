# Decision — Real-time features: polling vs WebSocket

**Status:** Decided (2026-08-10) — polling retained, WebSocket port deferred
**Applies to:** `src/routes/admin/+layout.svelte` (unread-count badge)

## Context

Audit finding CF-6 flagged that PM2 shipped a full WebSocket hub
(`server/lib/websocket/`, 569 lines: hub + auth + types + h3 route handler)
while PM3 uses a 30s fetch poll for the admin unread-contacts badge
(`src/routes/admin/+layout.svelte:90-98`).

## Evidence

- **PM2 WS hub:** `server/lib/websocket/_internal/hub.ts` (366 lines),
  `auth.ts` (124), `types.ts` (79), plus `server/api/ws.ts` handler using
  h3's `defineWebSocketHandler`. Supports auth, room subscriptions, message
  broadcast, rate limiting, ping/pong heartbeat.
- **PM3 consumer surface:** exactly one — the admin unread-contact-count
  badge polling `/api/admin/contacts/unread` every 30s. No support chat,
  no live notifications, no real-time dashboard in the active config.
- **PM3 config:** `MODULES.contact.enabled: false` (contact module disabled);
  single-container VPS deployment; no horizontal scaling (rate limiters are
  in-memory).

## Decision

**Keep 30s polling as the current implementation. Do not port the WebSocket
hub now.** Rationale:

1. **Zero active real-time consumers.** The only WS consumer in PM2's surface
   (admin unread badge) is adequately served by 30s polling. Porting 569 lines
   of infrastructure to replace one badge is negative ROI today.
2. **Feature-module gating.** The contact module — the primary source of
   "live notification" value — is disabled in this project's config
   (`MODULES.contact.enabled: false`). Real-time notifications have no data
   source until it is enabled.
3. **Framework layer, not project layer.** A WS hub is framework
   infrastructure. It should be added when a real-time feature (support chat,
   live admin notifications) actually ships — not speculatively.
4. **Cost/risk.** A port requires: `ws` dependency, adapter-node custom
   server entry, session-cookie auth over upgrade requests, room semantics,
   WSS termination behind Traefik, and client rewrite with fallback. That is
   real surface for an unused capability.

Trade-off accepted: admin unread badge is up to 30s stale. This is
deliberate and documented.

## When to revisit

Port the WS hub (adapting PM2's `server/lib/websocket/` to SvelteKit's
adapter-node custom server) when any of:

- a real-time feature ships (e.g., admin live notifications, support chat);
- `MODULES.contact` is enabled and live notification is requested;
- polling latency becomes an observable problem (measure before porting).

## Porting outline (when triggered)

1. Add `ws` dependency; create `src/lib/server/ws.ts` mirroring PM2's hub
   (connection registry, room subscriptions, broadcast, rate limit).
2. Create a custom server entry (`server.js`) with adapter-node; mount the
   WS upgrade handler on `/api/ws`.
3. Authenticate upgrade requests via the `pm-session` cookie
   (`authenticateWebSocket` from PM2's auth.ts).
4. Client: subscribe in admin layout; keep 30s polling as automatic
   fallback on connection failure.
5. Terminate TLS at Traefik (WSS proxied to the container).
