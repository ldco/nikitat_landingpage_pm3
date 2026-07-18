# Ansible - Provisioning and Docker Runtime Deployment

Prepares a VPS for PuppetMaster deployment.

The application runtime is a Docker container managed with the official `community.docker` collection. Traefik also runs in Docker and routes to the app container over the shared Docker network. Host `systemd` is not the app runtime in the canonical operator flow.

## Prerequisites

```bash
# Install Ansible
pip install ansible

# Or on Ubuntu/Debian
sudo apt install ansible

# Install required Ansible collections for Docker modules
ansible-galaxy collection install -r requirements.yml
```

## Quick Start

1. **Create a VPS on Selectel** (Ubuntu 22.04 recommended)

2. **Configure `.env`:**

   ```bash
   cp .env.example .env
   # Fill in SERVER_IP, SERVER_ROOT_PASSWORD, SITE_DOMAIN, ACME_EMAIL,
   # and PM_DOCKER_IMAGE / PM_DOCKER_USERNAME / PM_DOCKER_TOKEN.
   # Set SSH_KEY=false to keep password deploy access, or SSH_KEY=true for key auth.
   # Optional: set SITE_DOMAIN_ALIASES=www.example.com for redirect/cert aliases
   ```

3. **Run the public bootstrap flow:**

   ```bash
   npm run setup
   ```

4. **Redeploy normally after that:**

   ```bash
   npm run deploy
   ```

## What Gets Installed

| Component   | Purpose                      |
| ----------- | ---------------------------- |
| Docker      | App runtime, Traefik, image pull, and legacy volume migration support |
| UFW         | Firewall (ports 22, 80, 443) |
| FFmpeg      | Video processing             |
| SQLite3     | Database CLI tools           |
| deploy user | Remote deploy operator       |

## Roles

- **common** - System packages, timezone, limits
- **docker** - Docker Engine and Docker resources for the app runtime, Traefik, and legacy migration through `community.docker`
- **security** - UFW firewall, SSH hardening
- **deploy-user** - Create deploy user for SSH, sudo, and Docker access

## Commands

```bash
# Full setup
ansible-galaxy collection install -r requirements.yml
ansible-playbook provision-shared.yml

# Only specific role
ansible-playbook provision-shared.yml --tags docker

# Specific hosts
ansible-playbook provision-shared.yml --limit production

# Check mode (dry run)
ansible-playbook provision-shared.yml --check
```
