# PM Hard Rule: NEVER Touch `public/madebylogos/`

Date: 2026-06-06
Status: ENGRAVED — framework rule, non-negotiable.
Derivative scope: ALL PM projects, ALL agents (Kilo, Qwen, Claude, Codex).

## THE RULE

**Never read from, write to, or modify files in `public/madebylogos/`.**

This directory is the **project owner's exclusive space** for their brand attribution logos. It is NOT part of the framework's asset system.

### What `madebylogos/` IS

- The project owner places their own brand logo SVGs here
- The `footerMadeBy` config reads from this directory (or another path the owner configures)
- Only the project owner decides what files belong here

### What `madebylogos/` is NOT

- ❌ NOT a place for framework logos
- ❌ NOT a place for agent-generated placeholder logos
- ❌ NOT a directory to copy/restore/overwrite files in

### For agents

When working on a PM project:

1. **DO NOT** list the contents of `public/madebylogos/`
2. **DO NOT** copy files into `public/madebylogos/`
3. **DO NOT** delete or restore files in `public/madebylogos/`
4. **DO NOT** check `git diff` or file dates in `public/madebylogos/`

If the `footerMadeBy` logo is wrong, the fix is in `project/puppet-master.config.ts` (`basePath`, `available`, `langFallback`) — NOT in the filesystem.

If the logo files are missing or incorrect, tell the project owner — do NOT create placeholders.

### Why

Every time an agent overwrites `madebylogos/` files, the project owner must manually restore them. This has happened repeatedly in this project and causes significant frustration.

The folder is the project owner's attribution space — hands off.
