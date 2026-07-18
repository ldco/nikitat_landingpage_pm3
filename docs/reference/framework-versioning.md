# Framework Versioning

Puppet Master separates dependency freshness from deploy reproducibility.

## Version Sources

- `package.json` declares direct npm dependency ranges.
- `package-lock.json` locks the exact npm dependency graph used by builds.
- `framework.versions.json` declares non-npm framework defaults such as Docker base images, Traefik, and Ansible collection constraints.
- `.env` may override deploy/runtime defaults for a specific project.
- `APP_VERSION`, `BUILD_VERSION`, `BUILD_TIMESTAMP`, and `BUILD_SHA` identify the product release and exact deployed artifact; they are not dependency versions.

## New Projects

New projects must be created from a current Puppet Master framework release, including its committed `package-lock.json` and `framework.versions.json`.

Until Puppet Master is distributed as a separate package/template, the current official PM repository is the source of truth for new projects. Treat it as the reference release, not as just another client site.

For now, greenfield projects are created by copying or branching from the official PM app repository because framework code and project code are not fully separated yet. Update or pull the official framework baseline first, then initialize the project from that state so Nuxt, Vue, Docker images, deploy defaults, and scripts start from the latest tested contract.

Do not generate fresh projects from an old copied client app directory unless that copy has first been updated to the current official PM baseline.

Greenfield projects should replace project-specific content, seed data, branding, and assets after initialization while keeping the PM framework contracts intact.

Brownfield projects should first map the existing product against the current PM release, then migrate intentionally through documented release actions.

## Existing Projects

Existing projects should update through framework upgrades, not blind production dependency mutation.

The normal upgrade flow is:

1. Pull or merge the target Puppet Master framework release.
2. Run `npm ci`.
3. Run `npm run check:versions`.
4. Run `npm run lint`, `npm run test`, and `npm run build`.
5. Build the Docker image and deploy as a new build version.
6. Keep rollback available until health checks and core user flows pass.

For npm packages, update `package.json` and regenerate `package-lock.json` in a branch. For runtime images, update `framework.versions.json` first, then run the version contract check and Docker build.

## Policy

- Patch and security updates may be batched frequently.
- Minor updates should be regular and CI-gated.
- Major updates require a framework release note and migration guidance.
- Production deploys should use the committed lockfile and versioned Docker image.
- Regulated deployments may pin Docker images by digest in `.env` or in the project-specific version manifest.

## Validation

Run:

```bash
npm run check:versions
```

This verifies that Dockerfile, deploy scripts, `.env.example`, Ansible requirements, and npm lockfile expectations match the framework version contract.
