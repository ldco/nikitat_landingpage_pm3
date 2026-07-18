# Plan: Server Stability Fix + Lighthouse Deploy

## Root Cause Confirmed

VPS Timeweb (961MB RAM, 0 MB swap). Docker containers + system eat 94% RAM. When `docker load` runs via SSH tunnel, system hits memory pressure → sshd can't fork → deploy fails and SSH dies entirely. OOM not triggered yet, but system freezes at swap-less pressure.

## Phase 1: Immediate Recovery (VNC — User)

```bash
# 1. Swap already created. Make permanent:
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# 2. Restart sshd (should work now with swap):
systemctl restart sshd

# 3. Reboot for clean state:
reboot
```

After reboot, SSH should work. I'll connect and proceed.

## Phase 2: Diagnostic (SSH — Agent)

```bash
# RAM & swap
free -h
swapon --show

# OOM history (if any)
dmesg | grep -i oom

# Docker container resource usage
docker stats --no-stream 2>/dev/null

# Docker daemon memory limits
docker info 2>/dev/null | grep -i mem

# SSH config (ClientAliveInterval)
grep -r 'ClientAlive\|TCPKeepAlive' /etc/ssh/sshd_config*

# auth.log — failed auth attempts (Timeweb filter evidence)
tail -40 /var/log/auth.log

# Disk
df -h /
docker system df
```

## Phase 3: Permanent Fixes (Agent)

### 3a. Make swap permanent ✅

Already done (`/etc/fstab` entry from Phase 1). Swap survives reboots.

### 3b. Add Docker memory limits

Edit container docker-compose to cap memory at 256MB each:

```yaml
# In /home/deploy/app/stacks/nikitat-pro/docker-compose.yml
services:
  nikitat-pro:
    deploy:
      resources:
        limits:
          memory: 256M
```

This prevents one container from starving the host.

### 3c. Fix SSH idle timeout

In `ansible/roles/security/tasks/main.yml`, increase `ClientAliveInterval` from 300 to 900:

```yaml
- name: Set SSH idle timeout
  line: 'ClientAliveInterval 900'
```

Also add `ClientAliveCountMax 3` so client has 3×900=45min before server kills connection.

### 3d. Fix Timeweb IP blocking

In Timeweb hosting panel: whitelist local IP to prevent SSH filtering after multiple auth attempts.

### 3e. Fix `/tmp` permissions permanently

`/tmp` was owned by UID 1001. After reboot it might revert. Add a systemd tmpfiles rule:

```
# /etc/tmpfiles.d/tmp-perms.conf
d /tmp 1777 root root -
```

### 3f. Fix local Docker image buildup

Already committed (`ansible/deploy.yml` now prunes old images). No further action needed — next deploy will auto-clean.

## Phase 4: Deploy Lighthouse Fixes

Changes already committed (commit `55e35261`):

| File | Change |
|------|--------|
| `app/assets/css/typography/base.css` | Link color uses `light-dark()` for contrast |
| `app/assets/css/skeleton/nav.css` | Nav-link active uses `light-dark()` |
| `app/components/sections/SectionHero.vue` | Hero logo explicit width/height |
| `nuxt.config.ts` | ISR for SSR pages, `/madebylogos/` cache |
| `server/plugins/csp-nonce.ts` | CSP `'self'` removed from script-src |

After server is stable: `npm run deploy`

## Phase 5: Verify

1. `curl https://nikitat.pro/api/health` — server alive
2. Lighthouse audit — target 100/100/100/100
3. SSH stays alive during deploy

## Open Questions

- What is the RAM of this Timeweb VPS tier? (observed: 961MB)
- Can it be upgraded to 2GB?
- Is Zabbix agent consuming significant memory? (`ps aux | grep zabbix`)
