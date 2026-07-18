# Puppet Master Entrypoints

This is the first documentation page to open when you start work in Puppet Master.

## Choose Your Path

Pick exactly one entrypoint based on your goal:

| If your goal is... | Start here |
|---|---|
| Build or change the PM framework itself | [Framework Development](./framework-development.md) |
| Launch a new product on PM from scratch | [Greenfield Build](./greenfield-build.md) |
| Migrate or upgrade an existing product | [Brownfield Migration](./brownfield-migration.md) |

## Fast Decision Rule

1. New codebase on PM -> Greenfield.
2. Existing codebase moving to PM, existing data/routes/UI contracts, or PM version upgrade -> Brownfield.
3. Core framework behavior, contracts, architecture, release policy, or reusable PM tooling changes -> Framework Development.

## Current Official Source

Until Puppet Master is split into a standalone framework distribution, this repository is the official PM reference source. New sites should start by copying or branching from the latest accepted state of this repository, with its committed lockfile, version manifest, release notes, CSS system, admin contracts, and API conventions intact.

Use the official PM source as the baseline, then replace the client-specific content, config, seed data, assets, modules, section routing, and runtime CSS imports. Avoid old client project copies unless they have first been brought up to the current PM baseline.

For greenfield work, "configured" is not enough. The base is not acceptable until active runtime/config/seed/public files no longer carry the previous client project's brand, routes, section IDs, CSS, legal/contact settings, or enabled modules unless the new brief explicitly asks for them. See [Greenfield Build](./greenfield-build.md) for the required residue audits.

## First 15 Minutes

1. Open your chosen entrypoint file above.
2. Run setup (`/pm-init` in Claude/Qwen, or `npm run init`).
3. Run quality gates:
   - `npm run lint`
   - `npm run test:run`
   - `npm run build`
4. Read release contracts before touching framework behavior:
   - `docs/releases/README.md`
   - latest release in `docs/releases/`

## Related Documents

- Main project onboarding: `README.md`
- Full docs index: `docs/README.md`
- Contribution and framework rules: `contributing/CONTRIBUTING.md`
- Version policy: `docs/reference/framework-versioning.md`
