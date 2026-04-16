# mcp-url-sift

`mcp-url-sift` is a budget-safe MCP server for single-URL content extraction with adaptive output.

## Why this exists

Smaller models benefit from live web reads, but URL size is unknown until after fetch.

`mcp-url-sift` provides a safer default:

- enforce a configurable token budget for immediate responses
- return full content only when it fits the budget
- return a compact manifest for oversized pages
- let the agent page through content with `read_website_chunk`

Use it to pull live page context without accidental token blowups.

## Scripts

- `npm run dev` - run the TypeScript entrypoint with `tsx`
- `npm run check` - run type checking
- `npm run test` - run unit tests
- `npm run build` - compile to `dist/`
- `npm run start` - run compiled output
- `npm run mcp:dev` - run the MCP stdio server from source
- `npm run mcp:start` - run the compiled MCP stdio server
- `npm run mcp:smoke` - build and run an MCP stdio smoke test

## MCP client setup (`npx`)

Run `mcp-url-sift` directly from GitHub with `npx`.

Quick start (small, safe defaults):

```json
{
  "mcpServers": {
    "url-sift": {
      "command": "npx",
      "args": ["-y", "github:jhstatewide/mcp-url-sift"],
      "env": {
        "MCP_URL_SIFT_MAX_RETURN_TOKENS": "1200",
        "MCP_URL_SIFT_MAX_CHUNK_TOKENS": "600"
      }
    }
  }
}
```

`github:jhstatewide/mcp-url-sift` tracks latest. For reproducible behavior, pin a tag or commit:

```json
{
  "mcpServers": {
    "url-sift": {
      "command": "npx",
      "args": ["-y", "github:jhstatewide/mcp-url-sift#v0.1.0"]
    }
  }
}
```

Tuned profile:

```json
{
  "mcpServers": {
    "url-sift": {
      "command": "npx",
      "args": ["-y", "github:jhstatewide/mcp-url-sift"],
      "env": {
        "MCP_URL_SIFT_MODE": "auto",
        "MCP_URL_SIFT_MAX_RETURN_TOKENS": "1800",
        "MCP_URL_SIFT_MAX_CHUNK_TOKENS": "900",
        "MCP_URL_SIFT_HARD_MAX_RETURN_TOKENS": "2500",
        "MCP_URL_SIFT_HARD_MAX_CHUNK_TOKENS": "1200",
        "MCP_URL_SIFT_TIMEOUT_MS": "15000",
        "MCP_URL_SIFT_MAX_RESPONSE_BYTES": "2500000",
        "MCP_URL_SIFT_CACHE_ENABLED": "true",
        "MCP_URL_SIFT_CACHE_TTL_SECONDS": "3600",
        "MCP_URL_SIFT_SAFETY_MARGIN_PERCENT": "20",
        "MCP_URL_SIFT_INCLUDE_SUMMARY_ON_OVERFLOW": "true",
        "MCP_URL_SIFT_INCLUDE_RECOMMENDED_CHUNK": "true",
        "MCP_URL_SIFT_ALLOW_PRIVATE_HOSTS": "false",
        "MCP_URL_SIFT_USER_AGENT": "mcp-url-sift/0.1.0"
      }
    }
  }
}
```

## MCP tools

`mcp-url-sift` exposes two tools:

- `read_website`
- `read_website_chunk`

`read_website` inputs:

- `url` (required)
- `mode` (optional: `"auto" | "full" | "summary" | "manifest"`)
- `max_return_tokens` (optional)
- `max_chunk_tokens` (optional)

`read_website` delivery is adaptive:

- `delivery: "full"` for small pages
- `delivery: "manifest"` for oversized pages with chunk metadata

`full` response shape (example):

```json
{
  "delivery": "full",
  "url": "https://example.com",
  "finalUrl": "https://example.com/",
  "estimatedTokens": 420,
  "content": "# Example Domain\n..."
}
```

`manifest` response shape (example):

```json
{
  "delivery": "manifest",
  "url": "https://example.com",
  "finalUrl": "https://example.com/",
  "estimatedTokens": 3200,
  "recommended_chunk_id": "chunk-1",
  "chunks": [{ "id": "chunk-1", "estimatedTokens": 780, "preview": "..." }]
}
```

Recommended flow for constrained models: call `read_website` first; call `read_website_chunk` only when `delivery` is `manifest`.

1. Call `read_website` in `auto` mode.
2. If `delivery` is `full`, use returned content directly.
3. If `delivery` is `manifest`, pick a `chunk_id` (or `recommended_chunk_id`).
4. Call `read_website_chunk` to retrieve only the needed section.

`read_website_chunk` inputs:

- `url` (required)
- `chunk_id` (required)

## Configuration

Optional config file:

- default: `mcp-url-sift.config.json`
- override with `MCP_URL_SIFT_CONFIG_PATH`

Precedence: env vars > config file > built-in defaults.

Useful env vars:

- `MCP_URL_SIFT_MODE`
- `MCP_URL_SIFT_MAX_RETURN_TOKENS`
- `MCP_URL_SIFT_MAX_CHUNK_TOKENS`
- `MCP_URL_SIFT_HARD_MAX_RETURN_TOKENS`
- `MCP_URL_SIFT_TIMEOUT_MS`
- `MCP_URL_SIFT_MAX_RESPONSE_BYTES`
- `MCP_URL_SIFT_CACHE_TTL_SECONDS`
- `MCP_URL_SIFT_SAFETY_MARGIN_PERCENT`
- `MCP_URL_SIFT_ALLOW_PRIVATE_HOSTS`

See `mcp-url-sift.config.example.json` for a full config template.
