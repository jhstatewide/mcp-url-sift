#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";
import { InMemoryCacheStore } from "./cache/cacheStore.js";
import { loadConfig } from "./config/loadConfig.js";
import { readWebsite } from "./tools/readWebsite.js";
import { readWebsiteChunk } from "./tools/readWebsiteChunk.js";
import { toErrorPayload } from "./types/errors.js";

async function main(): Promise<void> {
  const config = await loadConfig();
  const cache = new InMemoryCacheStore(config.cache.ttlSeconds);

  const server = new McpServer({
    name: "mcp-url-sift",
    version: "0.1.0",
  });

  server.registerTool(
    "read_website",
    {
      description:
        "Safely read a URL without overflowing context. Use this first: it returns full content when small, or a manifest with chunk IDs when content is large.",
      inputSchema: {
        url: z.string().url().describe("Absolute http/https URL to read."),
        mode: z
          .enum(["auto", "full", "summary", "manifest"])
          .optional()
          .describe(
            "Response mode. auto=full if safe else manifest; full=force full content; manifest=force chunk manifest; summary=manifest with concise summary.",
          ),
        max_return_tokens: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Optional token budget for immediate response content."),
        max_chunk_tokens: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Optional token budget per chunk in manifest/chunk mode."),
      },
    },
    async (args) => {
      try {
        const response = await readWebsite(args, { config, cache });
        return {
          structuredContent: response,
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
        };
      } catch (error) {
        const payload = toErrorPayload(error, args.url);
        return {
          isError: true,
          structuredContent: payload,
          content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        };
      }
    },
  );

  server.registerTool(
    "read_website_chunk",
    {
      description:
        "Read one chunk from a prior read_website manifest. Use after read_website returns delivery=manifest.",
      inputSchema: {
        url: z.string().url().describe("Same URL used in read_website."),
        chunk_id: z
          .string()
          .min(1)
          .describe("Chunk ID from read_website (often recommended_chunk_id or a chunks[].id value)."),
      },
    },
    async (args) => {
      try {
        const response = await readWebsiteChunk(args, { config, cache });
        return {
          structuredContent: response,
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
        };
      } catch (error) {
        const payload = toErrorPayload(error, args.url);
        return {
          isError: true,
          structuredContent: payload,
          content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        };
      }
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
