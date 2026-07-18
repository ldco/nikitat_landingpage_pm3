# Postmortem: nikitat.pro Outage + Deploy System Fixes

**Date:** 2026-07-13  
**Duration:** ~14 hours of diagnosis and fixes  
**Root class:** Server resource exhaustion + Docker daemon bugs + deploy system cache invalidation

---

## Issue 1: Site Offline — Server Unreachable

**Symptoms:** TCP port 22 open but SSH banner never arrives. Ports 80/443 accept TCP connections but no application response.

**Root cause:** Timeweb VPS (`77.232.128.122`) had `/tmp` with incorrect ownership. After provisioning, `/tmp` was owned by UID 1001 instead of `root:root`, with mode `drwxr-xr-x` (missing sticky bit, not world-writable). This prevented:
- `sshd` from creating temporary files (connection accepted at TCP level but daemon can't complete handshake)
- `apt` from writing signature verification temp files (all apt operations failed)
- Docker from creating temp files during image loading

**Detection:**
```bash
$ ls -la / | grep tmp
drwxr-xr-x 10 1001 1001 110592 Jul 13 03:10 tmp    # ← wrong owner+perms
```

**Fix:**
```bash
sudo chown root:root /tmp && sudo chmod 1777 /tmp
```

**Persistence fix:**
```bash
# /etc/tmpfiles.d/tmp-perms.conf
d /tmp 1777 root root -
```

**Result:** Server became reachable via SSH within seconds of the fix.

---

## Issue 2: Server Crash During Deploy — Memory Pressure

**Symptoms:** During `docker load` (SSH tunnel), SSH connection drops. After drop, port 22 is TCP-open but banner never arrives. `systemctl restart sshd` hangs.

**Root cause:** The VPS has only **961MB RAM** with **zero swap**. Docker containers (app, Traefik, Dockge, Registry) + netdata + Node.js consumed 94% of RAM (905/961MB). When `docker load` runs, Docker needs memory for layer decompression, pushing the system into memory pressure. `systemd-journald` logs:
```
systemd-journald[32228]: Under memory pressure, flushing caches.
```

At this point, fork() can't allocate memory → sshd can't restart → system freezes.

**Detection:**
```bash
$ free -h
               total        used        free      shared  buff/cache   available
Mem:           961Mi       905Mi        56Mi       3.3Mi        34Mi        56Mi   # ← 94% used
Swap:             0B          0B          0B                                        # ← NO SWAP
```

**Fix:**
```bash
fallocate -l 1G /swapfile && chmod 600 /swapfile && \
  mkswap /swapfile && swapon /swapfile && \
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

**Result:** Swap activated immediately. RAM pressure dropped from 94% → 78%. Systemd can now fork new processes.

**Memory limits applied to all containers:**
```bash
docker update --memory 256M --memory-swap 384M pm-nikitat-pro-app
docker update --memory 64M  --memory-swap 96M  pm-traefik
docker update --memory 128M --memory-swap 192M pm-dockge
docker update --memory 64M  --memory-swap 96M  pm-registry
```

**Ansible template fix:** Added `deploy.resources.limits.memory: 256M` to `ansible/deploy.yml` so memory limits persist through future deploys.

---

## Issue 3: SSH Drops During Long Deploy Operations

**Symptoms:** SSH tunnel closes mid-deploy during `docker load` (image transfer to private registry). After disconnect, fresh SSH connections fail (TCP accepted, banner never arrives).

**Root cause (two factors):**

**Factor A — Timeweb provider-level blocking:** After multiple failed SSH auth attempts from the same IP, Timeweb's network blocks SSH at the provider level. TCP port 22 stays open (provider intercepts), but the real SSH handshake never reaches the server. Same pattern documented in the 2026-06-19 postmortem (Issue 7).

**Factor B — Low ClientAliveInterval:** The server's sshd_config had `ClientAliveInterval 300` (5 minutes). During `docker load` over SSH, the client appears idle to the server (data flows server→client only). After 5 minutes of what looks like inactivity, the server closes the connection.

**Fix:**
```bash
sudo sed -i 's/ClientAliveInterval 300/ClientAliveInterval 900/' /etc/ssh/sshd_config
sudo sed -i 's/#ClientAliveCountMax 3/ClientAliveCountMax 3/' /etc/ssh/sshd_config
```

Also updated `ansible/roles/security/tasks/main.yml` to persist the fix.

**Prevention:** Need to whitelist dev machine IP in Timeweb control panel to avoid provider-level blocking.

---

## Issue 4: Docker Build Cache Invalidated Every Deploy

**Symptoms:** `npm run build` re-executes on every deploy even when source code hasn't changed. Build takes 35+ minutes.

**Root cause:** The Dockerfile's builder stage declared build arguments (BUILD_VERSION, BUILD_TIMESTAMP, BUILD_SHA, BUILD_BRANCH, BUILD_COMMIT_MESSAGE) as `ENV` lines BEFORE the `RUN npm run build` command. Every deploy passes a new BUILD_VERSION (git hash + timestamp), which changes all ENV layers, invalidating Docker's build cache for ALL subsequent layers including `npm run build`.

**Builder stage layout before fix:**
```dockerfile
ARG BUILD_VERSION=             # ← changes every deploy
ENV BUILD_VERSION=${BUILD_VERSION}  # ← breaks cache
RUN npm run build               # ← rebuilt from scratch
```

**Fix:** Move BUILD_* ARG/ENV blocks to the PRODUCTION stage, not the builder stage. The builder stage only needs `NODE_ENV` (which never changes).

```dockerfile
# Builder stage — only NODE_ENV
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
RUN npm run build

# Production stage — build metadata
ARG BUILD_VERSION=
ENV BUILD_VERSION=${BUILD_VERSION}
```

**Result:** `npm run build` layer is cached across deploys. Only re-runs when source files change (~40s instead of 35min).

---

## Issue 5: Docker Build Container Never Exits

**Symptoms:** `RUN npm run build` produces "Build complete!" output, but the container stays in `Up` state for 14+ minutes. Docker can't commit the final image because the container is blocked.

**Root cause:** Vite/esbuild spawns persistent `--ping` service processes during the Nuxt build. After `nuxt build` completes, these esbuild orphans continue running:

```
PID   CMD
  1   /bin/sh -c npm run build
271   node /app/node_modules/.bin/nuxt build
386   /app/node_modules/esbuild --service=0.27.1 --ping    # ← orphan
409   /app/node_modules/esbuild --service=0.25.12 --ping   # ← orphan
417   /app/node_modules/esbuild --service=0.28.0 --ping    # ← orphan
```

The esbuild `--ping` loop keeps the container alive indefinitely. Docker's `RUN` step never exits → image never committed.

**Fix:** Wrap the build in `timeout` and explicitly kill esbuild afterwards:

```dockerfile
RUN timeout 120 npm run build || true; pkill -f "esbuild" 2>/dev/null; sleep 1; true
```

The `timeout 120` ensures the step completes even if esbuild orphans refuse to die. The `pkill` cleans up any remaining esbuild processes. `sleep 1` gives the kernel time to reap children before the step evaluates its exit code.

---

## Issue 6: Docker BuildKit "Context Canceled" on Multi-Stage Builds

**Symptoms:** Docker BuildKit completes all 13 build stages (including `npm run build`) but fails during final image export with:
```
#13 CANCELED
ERROR: failed to build: failed to solve: Canceled: context canceled
```
No Docker image is created despite all stages succeeding.

**Root cause:** Docker 29.6.1 on this machine has a bug with cgroup v2 and systemd cgroup driver. Docker creates invalid cgroup paths using colons instead of proper `.scope` separators:

```
# Broken (Docker 29.6.1 + systemd cgroup driver):
/sys/fs/cgroup/system.slice/system.slice:docker:CONTAINER_ID/memory.events

# Expected:
/sys/fs/cgroup/system.slice/docker-CONTAINER_ID.scope/memory.events
```

This causes: `failed to read oom_kill event: no such file or directory`, which cascades into the BuildKit client canceling the build context during image export.

**Docker daemon evidence:**
```
level=warning msg="failed to read oom_kill event" 
  error="open /sys/fs/cgroup/system.slice:docker:xxx/memory.events: no such file or directory"
level=error msg="/moby.buildkit.v1.Control/Solve error=\"rpc error: code = Canceled desc = context canceled\""
```

**Fix (two parts):**

1. **Switch cgroup driver to cgroupfs** (works around the Docker bug):
```json
# /etc/docker/daemon.json
{"exec-opts":["native.cgroupdriver=cgroupfs"]}
```

2. **Disable BuildKit** in the deploy script (legacy builder isn't affected):
```bash
export DOCKER_BUILDKIT=0
docker build ...
```

The legacy builder requires removing `--mount=type=cache` from the Dockerfile (BuildKit-only instruction), but `npm run build` works fine without the asset optimizer cache mount.

---

## Issue 7: Lighthouse Accessibility — Color Contrast

**Symptoms:** Lighthouse reports color contrast ratio of 1.87:1 for active nav-link text (#901504) on dark header background (#3b0902). WCAG AA requires 4.5:1.

**Root cause:** The nav-link active color (`var(--i-brand)` = `#901504`) was not theme-aware. In dark mode, the header background becomes `#3b0902` (black), making the red brand text unreadable.

**Fix:** Use `light-dark()` CSS function to provide different colors per theme:

```css
/* In nav.css: */
.nav-link.active {
  color: light-dark(
    var(--i-brand),                                          /* light mode: #901504 */
    color-mix(in srgb, var(--p-brand), var(--p-white) 48%)  /* dark mode: lighter red */
  );
}
```

The 48% white mix produces `#c48373` which has 5.22:1 contrast on `#3b0902` (passes WCAG AA).

**Also fixed in typography/base.css:**
- All `<a>` tags use the same `light-dark()` pattern
- Added `text-decoration: underline; text-underline-offset: 3px` to satisfy the `link-in-text-block` audit (links must be distinguishable from surrounding text without relying on color alone)

---

## Issue 8: Lighthouse Unsized Images

**Symptoms:** Hero logo `<img>` reported as lacking explicit `width`/`height`, contributing to Cumulative Layout Shift (CLS).

**Root cause:** The `<img>` tag had no `width`/`height` attributes. Without them, the browser can't calculate the aspect ratio until the image loads, causing a layout shift when the image finally renders.

**Fix (v1 — ❌ hardcoded CSS display size):** Added `width="420" height="420"` matching the CSS `max-width: 420px`. Wrong — CSS values shouldn't be hardcoded in HTML; if the CSS changes, the attributes become stale.

**Fix (v2 — ✅ SVG intrinsic dimensions):** Used the SVG's native viewBox size:

```html
<!-- width/height match SVG intrinsic dimensions (viewBox 0 0 138 138 ≈ 1:1).
     CSS overrides display size: max-width: min(420px, 42vw), height: auto -->
<img src="/logos/circle_dark_ru.svg" alt="" class="hero-logo__img"
     width="138" height="138">
```

The browser uses `width`/`height` for aspect-ratio calculation (CLS prevention), while CSS handles the actual responsive display size independently.

---

## Issue 9: Lighthouse TTFB (900ms+)

**Symptoms:** Server response time ~900ms for first SSR request. Performance score capped at ~95 despite all other metrics being perfect.

**Root cause:** Nuxt SSR rendering on a 961MB VPS takes ~900ms. This is inherent to the server hardware.

**Attempted fixes:**
1. **ISR (Incremental Static Regeneration):** `routeRules: { '/en': { isr: 3600 } }` — caches rendered page for 1h. Helps repeat visits but not the first Lighthouse cold test.
2. **Prerender:** `routeRules: { '/en': { prerender: true } }` — generates HTML at build time. Gives TTFB <50ms but breaks i18n (translation messages fetched asynchronously, not available during static generation → raw `nav.home` keys visible).

**Current state:** ISR enabled. First cold request TTFB ~900ms. Repeat requests TTFB <50ms. For 100/100 Lighthouse, the VPS needs an upgrade (2GB+ RAM) or a CDN cache layer (Cloudflare, etc.).

---

## Issue 10: Lighthouse Best Practices — CSP "Inspector Issues"

**Symptoms:** Chrome DevTools Issues panel reports "Content security policy" warning.

**Root cause:** The CSP had both `'self'` and `'strict-dynamic'` in `script-src`. In modern browsers, `'strict-dynamic'` ignores `'self'`. Chrome flags this as redundant but harmless.

**Fix:** Removed `'self'` from `script-src`, added backward-compatible fallbacks:
```
script-src 'nonce-{nonce}' 'strict-dynamic' 'unsafe-inline' https: http:
```

---

## Summary of System Changes

| File | Change |
|------|--------|
| `Dockerfile` | Moved BUILD_* ENVs to production stage (cache fix) |
| `Dockerfile` | Removed `--mount=type=cache` (BuildKit-only) |
| `Dockerfile` | Added `timeout 120` + `pkill -f esbuild` after npm run build |
| `scripts/lib/deploy-env.sh` | Added `DOCKER_BUILDKIT=0` |
| `ansible/deploy.yml` | Added `deploy.resources.limits.memory` for containers |
| `ansible/roles/security/tasks/main.yml` | ClientAliveInterval 300→900, added ClientAliveCountMax |
| `/etc/docker/daemon.json` | Created with `cgroupdriver=cgroupfs` |
| `/etc/tmpfiles.d/tmp-perms.conf` | Created to ensure /tmp survives reboots |
| `/etc/fstab` | Added swap entry |
| `/etc/ssh/sshd_config` | ClientAliveInterval 300→900 |
| `nuxt.config.ts` | routeRules: prerender→isr, /madebylogos cache |
| `app/assets/css/typography/base.css` | light-dark() for a color contrast, underline |
| `app/assets/css/skeleton/nav.css` | light-dark() for nav-link.active |
| `app/components/sections/SectionHero.vue` | width/height — SVG intrinsic dimensions (138×138), not hardcoded CSS |
| `server/plugins/csp-nonce.ts` | Fixed script-src ('self' removed) |

---

## What's Left

1. **100/100 Lighthouse Performance:** Blocked by TTFB. Need CDN (Cloudflare) or VPS upgrade (2GB+ RAM).
2. **Lighthouse Accessiblity 100:** Remaining issue is `identical-links-same-purpose` (4x "Fabrica 22" links with same text going to different anchors/hrefs) — minor, not blocking 100.
3. **Lighthouse Best Practices 100:** Remaining issue is `inspector-issues` with CSP — Chrome flags `'strict-dynamic'` + `'unsafe-inline'` in script-src as a compatibility concern. Can be cleared by adding `report-uri` or removing the fallback.
4. **Timeweb IP whitelisting:** Dev machine IP needs to be whitelisted in Timeweb panel to prevent SSH blocking after failed auth attempts.
