# MCP Architecture Optimization Plan

## Status: IMPLEMENTED (partial — see Deferred)

## Architecture Summary

Two-layer configuration: global (cross-project) + per-project (framework-specific).

### Global Layer (`~/.config/kilo/kilo.json`)

| Component | What | Status |
|---|---|---|
| **context7** MCP | Version-specific docs on demand | Active |
| **sqlite** MCP | Local DB access | Active |
| **puppeteer** MCP | Frontend rendering/visual testing | Active |
| **puppetmaster** MCP | PM framework operations | Active |
| **tausik** MCP | Project management, memory, tasks | Active |
| **git** MCP (`mcp-server-git`) | Structured git operations (12 tools) | **Added** |
| **instructions** | Global behavioral rules | **Added** |

**Total: 6 MCP servers.**

### Global Behavioral Rules (`/home/ldco/.config/kilo/instructions/engineering-rules.md`)

Stack-agnostic rules injected into every session:
- No placeholders, complete code only
- Direct architecture, no over-engineering
- Concise communication (bullet points, tables)
- Tool discipline (parallel calls, no confirmation loops)
- TypeScript error handling (`catch (e: unknown)`, no `any`, no escape hatches)

### Per-Project Layer (`.kilo/kilo.json`)

Framework-specific config lives here:
- **PM projects**: Already covered by `AGENTS.md` (PM framework rules) + `pm-framework` skill + puppetmaster MCP
- **FastAPI/Python projects**: Create project `.kilo/kilo.json` with Python-specific MCPs and `AGENTS.md` with FastAPI rules
- **Other stacks**: Same pattern — project-specific `AGENTS.md` + MCPs if needed

### Rejected MCPs

| MCP | Reason |
|---|---|
| Filesystem (Anthropic) | Redundant: Kilo has `read`, `glob`, `grep`, `semantic_search` natively |
| Sequential Thinking | Redundant: Kilo has built-in thinking mode |
| Firecrawl | Redundant: Kilo has `webfetch` natively; Puppeteer handles JS-rendered pages |
| Sentry | No confirmed Sentry usage; add later if needed |
| Memory/Knowledge Graph | Redundant: Tausik already provides full memory + graph system |

## Removed

| Item | Reason |
|---|---|
| `pm-framework` skill | Redundant: AGENTS.md (always loaded) + MCP `pm_knowledge` (on-demand, filterable) cover the same content |

## Deferred

| Item | Reason |
|---|---|
| Figma Context MCP | Will add later when needed |
| Project-level config templates | Write per-project `.kilo/kilo.json` and `AGENTS.md` when starting a new non-PM project |
