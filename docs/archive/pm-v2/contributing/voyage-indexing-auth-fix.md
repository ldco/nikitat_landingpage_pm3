# Voyage AI Code Indexing — Authentication Failure Debugging

> **Date:** 2026-06-13  
> **Upstream issue:** [Kilo-Org/kilocode#9775](https://github.com/Kilo-Org/kilocode/issues/9775)  
> **Status:** Resolved (config precedence conflict)

## Symptom

```
Code Indexing
Failed to initialize: Authentication failed. Please check your API key.
```

Kilo Code 7.3.45 CLI refused to initialize code indexing with a valid Voyage AI API key (`voyage-code-3`). The same API key returned HTTP 200 when tested directly via `curl`.

## Debugging journey

### Step 1 — API key validity

Tested the Voyage API key directly:

```bash
curl -s -w "%{http_code}" https://api.voyageai.com/v1/embeddings \
  -H "Authorization: Bearer pa-bsQ8tK8..." \
  -H "Content-Type: application/json" \
  -d '{"model":"voyage-code-3","input":["test"]}'
# → 200 OK
```

The key was valid. The problem was on Kilo's side.

### Step 2 — LiteLLM proxy workaround (abandoned)

Attempted to route Voyage through an OpenAI-compatible reverse proxy (LiteLLM), changing the config to:

```jsonc
{
  "indexing": {
    "provider": "openai-compatible",
    "openaiCompatible": {
      "baseUrl": "http://localhost:11434/v1",
      "apiKey": "litellm-proxy"
    }
  }
}
```

This also failed — not because of the proxy, but because Kilo's `isConfigured()` method (ported from Roo Code) hardcodes a check for `qdrantUrl` even when the vector store is LanceDB. Adding a dummy `qdrantUrl` was required to pass the check.

### Step 3 — Config precedence discovery

The CLI debug config repeatedly showed the **old** Voyage config even after editing `~/.config/kilo/kilo.json`. Running `kilo debug config` from the binary itself confirmed the stale values were coming from a **different** config file.

**Root cause:** Kilo's config resolution loads files in this order (low-to-high precedence, deep-merged):

| Priority | Path |
|---|---|
| 1 (lowest) | `~/.config/kilo/kilo.json` |
| 2 | `~/.kilo/kilo.json` |

A legacy `~/.kilo/kilo.json` file existed with:

```jsonc
{
  "indexing": {
    "provider": "voyage",
    "voyage": { "apiKey": "YOUR_VOYAGE_API_KEY" }
  }
}
```

The **placeholder** string `"YOUR_VOYAGE_API_KEY"` was deep-merging **over** the real API key in `~/.config/kilo/kilo.json`, because `~/.kilo/` wins over `~/.config/kilo/`. Kilo was authenticating with the literal placeholder — hence the 401.

## Resolution

### 1. Remove duplicate config source

```bash
rm ~/.kilo/kilo.json
```

### 2. Ensure real API key in canonical config

`~/.config/kilo/kilo.json`:

```jsonc
{
  "indexing": {
    "enabled": true,
    "provider": "voyage",
    "model": "voyage-code-3",
    "vectorStore": "lancedb",
    "voyage": { "apiKey": "pa-bsQ8tK8..." },
    "lancedb": {}
  }
}
```

### 3. Restart Kilo

After a clean Kilo restart, the Voyage embedder passed validation and indexing initialized successfully.

## Secondary bug discovered: `isConfigured()` and Qdrant

The `isConfigured()` method in the config-manager (inherited from Roo Code upstream) checks `qdrantUrl` for **all** embedder providers, including `openai-compatible` and `voyage`, even when `vectorStore` is set to `lancedb`. This means:

- Any non-truthy `qdrantUrl` → `isConfigured()` returns `false` → "Code indexing is not configured"
- The default (`http://localhost:6333`) only applies if `getGlobalState()` returns `null`/`undefined`
- If the CLI provides a partial config object (non-null), the default is lost

**Workaround:** Set a dummy `qdrantUrl` in the config if switching to `openai-compatible` with LanceDB in the future:

```jsonc
"qdrantUrl": "http://localhost:6333"
```

This satisfies the check without actually running any Qdrant server.

## Config precedence rules (Kilo CLI 7.3.45)

| Priority | Source |
|---|---|
| Low | `~/.config/kilo/kilo.json` (XDG global) |
| Medium | `./kilo.json` (project root) |
| Medium-High | `.kilo/kilo.json` (project .kilo dir) |
| High | `~/.kilo/kilo.json` (home .kilo dir) |

All sources are deep-merged. Later sources override earlier ones at the key level (not whole-object replacement). Boolean and string values from higher-precedence files silently replace lower ones.

**Lesson:** When debugging Kilo config issues, check ALL config locations, not just the one you're editing. The `kilo debug config` command shows the merged result but doesn't indicate which file each key came from.

## Verification

After fix, `kilo debug config` shows the real API key:

```json
{
  "indexing": {
    "provider": "voyage",
    "model": "voyage-code-3",
    "vectorStore": "lancedb",
    "voyage": {
      "apiKey": "pa-bsQ8tK8..."
    },
    "lancedb": {}
  }
}
```

Indexing status shows **Enabled** and begins scanning the codebase at startup.
