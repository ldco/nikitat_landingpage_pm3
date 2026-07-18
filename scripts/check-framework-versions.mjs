import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()

const read = (file) => fs.readFileSync(path.join(rootDir, file), 'utf8')
const fail = (message) => {
  console.error(`[versions] ERROR: ${message}`)
  process.exitCode = 1
}

const manifest = JSON.parse(read('framework.versions.json'))
const packageJson = JSON.parse(read('package.json'))
const dockerfile = read('Dockerfile')
const envExample = read('.env.example')
const deployEnv = read('scripts/lib/deploy-env.sh')
const deploySecrets = read('scripts/deploy-secrets.sh')
const dockerDev = read('scripts/docker-dev.sh')
const ansibleRequirements = read('ansible/requirements.yml')

const requiredRuntimeKeys = ['nodeImage', 'traefikImage']
for (const key of requiredRuntimeKeys) {
  if (typeof manifest.runtime?.[key] !== 'string' || manifest.runtime[key].length === 0) {
    fail(`framework.versions.json runtime.${key} must be a non-empty string.`)
  }
}

if (manifest.npm?.manifest !== 'package.json') {
  fail('framework.versions.json npm.manifest must point to package.json.')
}

if (manifest.npm?.lockfile !== 'package-lock.json') {
  fail('framework.versions.json npm.lockfile must point to package-lock.json.')
}

if (!packageJson.dependencies?.nuxt) {
  fail('package.json must declare nuxt as a direct dependency.')
}

if (!fs.existsSync(path.join(rootDir, 'package-lock.json'))) {
  fail('package-lock.json must be committed as the npm reproducibility lockfile.')
}

if (!dockerfile.includes(`ARG PM_NODE_IMAGE=${manifest.runtime.nodeImage}`)) {
  fail('Dockerfile PM_NODE_IMAGE default must match framework.versions.json runtime.nodeImage.')
}

if (/FROM\s+node:/g.test(dockerfile)) {
  fail('Dockerfile must use FROM ${PM_NODE_IMAGE}; do not hardcode node image tags in stages.')
}

if (!envExample.includes(`TRAEFIK_IMAGE=${manifest.runtime.traefikImage}`)) {
  fail('.env.example TRAEFIK_IMAGE must match framework.versions.json runtime.traefikImage.')
}

if (!deployEnv.includes('${TRAEFIK_IMAGE:-$(default_traefik_image)}')) {
  fail('scripts/lib/deploy-env.sh must resolve Traefik through default_traefik_image.')
}

if (!deploySecrets.includes('TRAEFIK_IMAGE="${TRAEFIK_IMAGE:-$(default_traefik_image)}"')) {
  fail('scripts/deploy-secrets.sh must resolve Traefik through default_traefik_image.')
}

if (!dockerDev.includes('--build-arg "PM_NODE_IMAGE=${PM_NODE_IMAGE:-$(default_node_image)}"')) {
  fail('scripts/docker-dev.sh must pass PM_NODE_IMAGE from the framework version contract.')
}

if (!ansibleRequirements.includes(`version: "${manifest.ansible?.communityDocker}"`)) {
  fail('ansible/requirements.yml community.docker version must match framework.versions.json ansible.communityDocker.')
}

if (!process.exitCode) {
  console.log('[versions] Framework version contract passed.')
}
