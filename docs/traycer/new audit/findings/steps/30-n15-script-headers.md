# Step 30 — N-15: Update PuppetMaster2 script headers

> **Phase:** Nice-to-have | **Finding:** N-15 | **Severity:** Repo-verified cosmetic

## What this step is

Shell scripts (`backup-db.sh`, `restore-db.sh`, etc.) carry "PuppetMaster2" headers from the PM2 copy. Cosmetic, but confusing for operators and agents grepping for product names.

## What we are doing

Update the script header comments to PM3 naming (consistent with Step 08's rebrand). No logic changes.

## Why

Repo-verified — Layer 4 §2.1 #15 lists the affected scripts.

## Plan

### Task 1: Update headers

- **Files:** `scripts/backup-db.sh`, `scripts/restore-db.sh`, `scripts/rollback.sh`, `scripts/deploy.sh`, `scripts/setup.sh`, `.dockerignore` header
- **Change:** Replace "PuppetMaster2" references in header comments with the PM3 product name.

## Verification

- [ ] `grep -ri "puppetmaster2" scripts/` returns no header-only references (excluding any intentional legacy notes)
- [ ] `bash -n` on each touched script passes
