import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

const deployEnvScript = 'scripts/lib/deploy-env.sh'

function runDeployEnvSnippet(snippet: string, env: Record<string, string> = {}) {
  return spawnSync('bash', ['-lc', `source ${deployEnvScript}\n${snippet}`], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      SITE_DOMAIN: '',
      SITE_DOMAIN_ALIASES: '',
      ...env
    },
    encoding: 'utf-8'
  })
}

describe('deploy env domain rendering', () => {
  it('renders the primary domain as the only Traefik host rule by default', () => {
    const dir = mkdtempSync(join(tmpdir(), 'pm-deploy-env-'))
    const outputFile = join(dir, 'deploy-vars.yml')

    const result = runDeployEnvSnippet(`render_ansible_deploy_vars_file ${outputFile} ssh_key`, {
      SITE_DOMAIN: 'Example.COM'
    })

    expect(result.status).toBe(0)

    const rendered = readFileSync(outputFile, 'utf-8')
    expect(rendered).toContain("site_domain: 'example.com'")
    expect(rendered).toContain("site_domain_aliases: ''")
    expect(rendered).toContain("traefik_host_rule: 'Host(`example.com`)'")
    expect(rendered).toContain("traefik_alias_redirect_regex: ''")
    expect(rendered).toContain("traefik_alias_redirect_replacement: 'https://example.com${2}'")
  })

  it('renders domain aliases into the Traefik host rule and redirect regex', () => {
    const dir = mkdtempSync(join(tmpdir(), 'pm-deploy-env-'))
    const outputFile = join(dir, 'deploy-vars.yml')

    const result = runDeployEnvSnippet(`render_ansible_deploy_vars_file ${outputFile} ssh_key`, {
      SITE_DOMAIN: 'example.com',
      SITE_DOMAIN_ALIASES: 'www.example.com, blog.example.com www.example.com'
    })

    expect(result.status).toBe(0)

    const rendered = readFileSync(outputFile, 'utf-8')
    expect(rendered).toContain("site_domain_aliases: 'www.example.com blog.example.com'")
    expect(rendered).toContain(
      "traefik_host_rule: 'Host(`example.com`) || Host(`www.example.com`) || Host(`blog.example.com`)'"
    )
    expect(rendered).toContain(
      "traefik_alias_redirect_regex: '^https?://(www\\.example\\.com|blog\\.example\\.com)(/.*)?$'"
    )
    expect(rendered).toContain("traefik_alias_redirect_replacement: 'https://example.com${2}'")
  })

  it('rejects aliases written as URLs instead of bare domains', () => {
    const result = runDeployEnvSnippet('validate_site_domains', {
      SITE_DOMAIN: 'example.com',
      SITE_DOMAIN_ALIASES: 'https://www.example.com'
    })

    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain('SITE_DOMAIN_ALIASES must be a bare domain name')
  })
})
