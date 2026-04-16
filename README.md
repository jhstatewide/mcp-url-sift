# mcp-url-sift

Budget-safe MCP server for single-URL content extraction with adaptive output.

## Why this exists

Smaller models often benefit from reading live web pages, but blindly fetching a URL is risky because content size is unknown up front.

`mcp-url-sift` provides a safer default:

- enforce a configurable token budget for immediate responses
- return full content only when it fits the budget
- return a compact manifest for oversized pages
- let the agent page through content with `read_website_chunk`

This gives agents web augmentation without accidental context blowups.

## Scripts

- `npm run dev` - run the TypeScript entrypoint with `tsx`
- `npm run check` - run type checking
- `npm run test` - run unit tests
- `npm run build` - compile to `dist/`
- `npm run start` - run compiled output
- `npm run mcp:dev` - run the MCP stdio server from source
- `npm run mcp:start` - run the compiled MCP stdio server
- `npm run mcp:smoke` - build and run an MCP stdio smoke test

## MCP tools

The MCP server in `src/server.ts` exposes:

- `read_website`
- `read_website_chunk`

`read_website` inputs:

- `url` (required)
- `mode` (optional: `"auto" | "full" | "summary" | "manifest"`)
- `max_return_tokens` (optional)
- `max_chunk_tokens` (optional)

Response delivery is adaptive:

- `delivery: "full"` for small pages
- `delivery: "manifest"` for oversized pages with chunk metadata

Typical flow for constrained models:

1. Call `read_website` in `auto` mode.
2. If `delivery` is `full`, use returned content directly.
3. If `delivery` is `manifest`, pick a `chunk_id` (or `recommended_chunk_id`).
4. Call `read_website_chunk` to retrieve only the needed section.

`read_website_chunk` inputs:

- `url` (required)
- `chunk_id` (required)

## Configuration

Optional config file path:

- default: `mcp-url-sift.config.json`
- override with `MCP_URL_SIFT_CONFIG_PATH`

Precedence is env vars > config file > built-in defaults.

Useful env vars:

- `MCP_URL_SIFT_MAX_RETURN_TOKENS`
- `MCP_URL_SIFT_MAX_CHUNK_TOKENS`
- `MCP_URL_SIFT_HARD_MAX_RETURN_TOKENS`
- `MCP_URL_SIFT_TIMEOUT_MS`
- `MCP_URL_SIFT_CACHE_TTL_SECONDS`
- `MCP_URL_SIFT_SAFETY_MARGIN_PERCENT`

See `mcp-url-sift.config.example.json` for a full config template.
