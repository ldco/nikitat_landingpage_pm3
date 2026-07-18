# Kilo Code Agent & Model Cheat Sheet

## Agents You Have

| Agent | Source | Tool Access | Use When |
|-------|--------|------------|----------|
| **code** | Built-in (default) | Full | Daily driver — features, fixes, refactors, reviews, tests, docs |
| **plan** | Built-in | Read + `.kilo/plans/*.md` edit | Quick architecture decisions, scoping work |
| **architect** | Custom (`kilo.json`) | Read + bash + `.kilo/plans/*.md` edit | Deep design: ADRs, C4, ISO 25010, trade-off matrices, anti-pattern detection. Auto-handoffs to `code` via `task` tool when plan approved |
| **ask** | Built-in | Read-only + read-only bash | Learning, exploring codebase, questions |
| **debug** | Built-in | Full | Stubborn bugs needing methodical root-cause analysis |
| **code-reviewer** | Custom (`kilo.json`) | Read + bash, **no edits, no MCP** | Read-only audit: run lint/tests/diff, report issues without modifying anything |

> `plan` for quick planning. `architect` for deep design with methodology.
> `orchestrator` is deprecated — all agents support subagents natively.

## DeepSeek Models — When & Which Variant

| Model | Params (total/active) | Context | $/1M input | Role |
|-------|----------------------|---------|------------|------|
| **deepseek-v4-pro** | 1.6T / 49B | 1M | $2.40 | Primary workhorse — complex coding, debugging, planning |
| **deepseek-v4-flash** | 284B / 13B | 1M | $0.20 | Fast/cheap — simple edits, refactors, boilerplate |

| Variant | Quality | Speed | Cost | When |
|---------|---------|-------|------|------|
| **low** | Minimal | Fastest | Lowest | Trivial: one-liners, boilerplate, doc text |
| **medium** | Balanced | Moderate | Moderate | Default for most coding — features, refactors, reviews |
| **high** | Deepest | Slowest | Highest | Complex architecture, hard bugs, multi-file refactors |

## Agent × Model Decision Matrix

| What You're Doing | Agent | Model | Variant |
|-------------------|-------|-------|---------|
| Implementing a feature | `code` | v4-pro | medium |
| Quick/trivial change | `code` | v4-flash | low |
| Complex multi-file change | `code` | v4-pro | **high** |
| Large refactor | `code` | v4-pro | **high** |
| Deep architecture / design | `architect` | v4-pro | **high** |
| Quick planning / scoping | `plan` | v4-pro | high |
| Debugging a stubborn bug | `debug` | v4-pro | **high** |
| Exploring / understanding code | `ask` | v4-flash | medium |
| Code review (read-only) | `code-reviewer` | v4-pro | medium |
| Code review + fix issues | `code` | v4-pro | medium |
| Writing tests | `code` | v4-pro | medium |
| Writing docs | `code` | v4-flash | low |
| Scaffolding / templates | `code` | v4-flash | low |

## Three Rules

1. **Default**: `code` + `v4-pro` + `medium`. Covers 80% of tasks.
2. **When quality matters**: bump to `high`. Marginal extra cost beats manual fixing.
3. **When speed matters**: `v4-flash` + `low` for straightforward throughput work.

## Runtime Switching

| Action | Keybind | Slash |
|--------|---------|-------|
| Switch agent | `ctrl+x` `a` | `/agents` |
| Switch model | `ctrl+x` `m` | `/models` |
| Switch variant | — | `/variant` |
| Cycle agent | `tab` / `shift+tab` | — |
