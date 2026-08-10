# Layer 4 — DevOps / Deploy Audit + Manual Verification Checklist

## Scope

Audit deployment-as-code and operator-flow consistency per spec:655a5dd7-1ae7-42b5-8b82-11c1cd095482/b258627c-201b-4ee1-bb52-966d9bdd2135 Layer 4, expanded to include docs-vs-scripts drift detection.

**In scope:**

- Audit file:ansible/ roles (common, security, monitoring, docker, deploy-user), file:Dockerfile, `.dockerignore` — compare against file:app-nuxt/ansible/ to confirm true parity (not a stale copy) and evaluate whether Ansible remains the right choice given the AI-agent-driven-dev goal, or whether a simpler container-native approach should be considered (with concrete trade-offs, not just "consider Kubernetes").
- **Operator-flow / docs-vs-scripts consistency (expanded scope)**: systematically cross-check every documented command in file:ansible/README.md, file:README.md, and other deploy docs against actual scripts in file:package.json and file:scripts/. Confirm/deny the already-observed drift: file:ansible/README.md instructs `npm run setup` for first-time bootstrap, but file:package.json currently has no `setup` script — determine if this is a genuine broken flow or if setup is invoked differently (e.g. a standalone script), and catalog any other such drifts.
- Trace file:scripts/deploy.sh end-to-end (env validation, Ansible invocation, Docker image build/push/stream, health check) and confirm it matches what file:.env.example documents as required variables.
- Produce the **manual-verification checklist** deliverable: concrete items the user must check on the actual live server that cannot be verified from code (running container/image versions, TLS cert status and expiry, firewall rule state, live env var values, actual CSP header served in production, DB backup cadence/last-backup timestamp, monitoring/alerting reachability).

**Out of scope:** application-level security findings (owned by Security ticket, though infra-security findings like UFW/SSH hardening belong here).

## Deliverable

A findings section with: Ansible/Docker parity verdict, a docs-vs-scripts drift table, a stack-fit verdict for the deploy approach, and the standalone manual-verification checklist — each finding tagged with severity.

## Spec References

spec:655a5dd7-1ae7-42b5-8b82-11c1cd095482/b258627c-201b-4ee1-bb52-966d9bdd2135 — Layer 4, Constraints & Boundaries, Severity model

## Dependencies

None — can start immediately.