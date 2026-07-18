# AI Dev Stack Analysis — Best Value for Russia, June 2026

## TL;DR

**Your stack (Kilo Code + DeepSeek V4 Pro/Flash) is the optimal choice for Russia.** Claude Code is not available in Russia. DeepSeek delivers ~90% of Claude/GPT quality at 1/50th the cost. Kilo Code is the best open-source multi-agent platform for the money. No changes needed.

---

## 1. Model Cost/Quality Comparison (Aider Polyglot Benchmark)

| Model | Pass Rate | Total Cost | Cost per % | Russia OK? |
|-------|-----------|------------|------------|------------|
| GPT-5 (high) | 88.0% | $29.08 | $0.33 | ❌ Blocked |
| Gemini 2.5 Pro | 83.1% | $49.88 | $0.60 | ❌ Sanctions |
| **DeepSeek V3.2 Reasoner** | **74.2%** | **$1.30** | **$0.018** | ✅ Chinese |
| DeepSeek R1 (0528) | 71.4% | $4.80 | $0.067 | ✅ Chinese |
| Claude Opus 4 (think) | 72.0% | $65.75 | $0.91 | ❌ Blocked |
| **DeepSeek V3.2 Chat** | **70.2%** | **$0.88** | **$0.013** | ✅ Chinese |
| Claude Sonnet 4 (think) | 61.3% | $26.58 | $0.43 | ❌ Blocked |
| DeepSeek V3 (0324) | 55.1% | $1.12 | $0.020 | ✅ Chinese |

**DeepSeek is 20-75x cheaper than Claude/GPT for comparable quality.** V3.2 Reasoner scores 74.2% vs Claude Opus 72.0% — DeepSeek actually wins while costing $1.30 vs $65.75.

## 2. Platform Comparison

| Platform | Price | Models | IDE Support | Open Source | Russia OK? | MCP Support |
|----------|-------|--------|-------------|-------------|------------|-------------|
| **Kilo Code** | **Free** | **500+** | VS Code, JetBrains, CLI | ✅ Apache-2.0 | ✅ | ✅ Full |
| Claude Code | Free (needs API) | Claude only | Terminal, VS Code, JetBrains | ❌ Proprietary | ❌ Blocked | ✅ |
| Cline | Free (needs API) | Any (BYOK) | VS Code, CLI | ✅ Apache-2.0 | ✅ (via API) | ✅ |
| Aider | Free (needs API) | Any (BYOK) | Terminal only | ✅ Apache-2.0 | ✅ (via API) | ❌ No |
| Cursor | $20/mo Pro | Limited | Forked VS Code | ❌ Proprietary | ⚠️ Maybe | ❌ No |
| Windsurf | $15/mo Pro | Limited | Forked VS Code | ❌ Proprietary | ⚠️ Maybe | ❌ No |
| GitHub Copilot | $10/mo | GPT-4o only | VS Code, JetBrains | ❌ Proprietary | ⚠️ Sanctions risk | ❌ No |
| Roo Code | — | — | — | — | ❌ Shut down May 2026 | — |

## 3. Why Claude Code Doesn't Work for Russia

- Anthropic API keys require billing address in supported country — Russia excluded
- Claude API blocks Russian IPs
- Russian bank cards can't pay Anthropic
- Even with VPN, billing verification catches you
- Claude subscription ($20/mo Pro, $200/mo Max) — payment method impossible

## 4. Your Current Stack Analysis

```
Kilo Code CLI (free, open-source)
├── DeepSeek V4 Pro ($2.40/1M input, primary)
├── DeepSeek V4 Flash ($0.20/1M input, fast/cheap)
├── Voyage AI indexing (voyage-code-3)
├── LSP enabled
├── Agents: architect (custom), code-reviewer (custom), code/plan/ask/debug (built-in)
└── MCP servers: context7, sqlite, puppeteer, puppetmaster, tausik, git
```

### What's Excellent

1. **Kilo Code is free** — no subscription, no per-seat cost
2. **DeepSeek pricing** — at $2.40/1M you get frontier-quality coding at budget prices
3. **Model freedom** — if DeepSeek degrades, switch to Qwen, MiniMax, or GLM (all Chinese, all cheap)
4. **Full MCP ecosystem** — puppeteer (browser), sqlite (DB), git (version control), context7 (docs), puppetmaster (Nuxt framework), tausik (task tracking)
5. **Custom agents** — architect with ADR/C4/ISO 25010 methodology, code-reviewer for read-only audits
6. **Open source** — no vendor lock-in, can fork/modify
7. **No US dependency** — DeepSeek + Kilo Code means zero exposure to US sanctions

### Potential Improvements

| Area | Current | Better? | Worth It? |
|------|---------|---------|-----------|
| Autocomplete | Not configured | Kilo free autocomplete with DeepSeek Flash | ✅ Yes — free, low latency |
| Qwen3.7 Plus ($0.32/1M) | Not used | Strong coding, dirt cheap | ⚠️ Try as fallback |
| MiniMax M3 ($0.30/1M) | Not used | 47.6% Kilo Bench, very cheap | ⚠️ Try as fallback |
| GLM-5.1 ($1.40/1M) | Not used | 49.4% Kilo Bench, strong long-horizon | ⚠️ Try for complex tasks |
| Ollama local models | Not used | Run fully offline (Gemma 4 26B is free) | ⚠️ POC only, slower than API |
| Aider as companion | Not used | Better at code editing, worse at agents | ❌ Not needed — Kilo covers this |

### What You're Missing (Low Priority)

1. **Autocomplete** — Kilo supports inline autocomplete via DeepSeek Flash. Free to enable.
2. **Slack/Telegram integration** — Claude Code/Cline have this. Kilo doesn't natively, but you could wire up through MCP.
3. **Headless CI agent** — Cline/Claude Code can run in GitHub Actions. Kilo can too but requires scripting.

## 5. The Verdict

```
                     Quality  Cost    Russia  Freedom  MCP   Verdict
Kilo + DeepSeek     ⭐⭐⭐⭐   ⭐⭐⭐⭐⭐  ✅      ⭐⭐⭐⭐⭐  ⭐⭐⭐⭐⭐  WINNER
Claude Code          ⭐⭐⭐⭐⭐  ⭐        ❌      ⭐       ⭐⭐⭐⭐   Not available
Cursor               ⭐⭐⭐⭐⭐  ⭐⭐⭐     ⚠️      ⭐       ❌       Vendor lock-in
Cline + DeepSeek     ⭐⭐⭐⭐   ⭐⭐⭐⭐⭐  ✅      ⭐⭐⭐⭐⭐  ⭐⭐⭐⭐⭐  Close 2nd
Aider + DeepSeek     ⭐⭐⭐    ⭐⭐⭐⭐⭐  ✅      ⭐⭐⭐⭐⭐  ❌       CLI only
```

**Your stack is the best combination of capability, cost, freedom, and Russia-accessibility available today.** The only credible alternative is Cline + DeepSeek (similar stack, but Kilo's agent system and MCP integration are more mature for your Puppet Master framework work).

## 6. Action Items (Nothing Urgent)

- [ ] Enable autocomplete: set `deepseek-v4-flash` as autocomplete model (Kilo Settings → Autocomplete)
- [ ] Monitor Qwen3.7 Plus and MiniMax M3 as DeepSeek fallbacks
- [ ] Keep an eye on YandexGPT for local Russian models (not competitive yet, but improving)
- [ ] Consider `kilo-auto/balanced` tier ($0.50/1M effective) for everyday work — routes to Qwen3.6 Plus with reasoning, solid quality
- [ ] The Voyage indexing API key in your config is exposed — rotate it if public
