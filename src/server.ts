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
        "Fetch and extract the main readable content from a single webpage. Returns full content when safe, or a compact manifest with chunk information when oversized.",
      inputSchema: {
        url: z.string().url().describe("Absolute URL to fetch."),
        mode: z
          .enum(["auto", "full", "summary", "manifest"])
          .optional()
          .describe("Delivery mode. Defaults to auto."),
        max_return_tokens: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Optional immediate return token budget override."),
        max_chunk_tokens: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Optional chunk token budget override."),
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
      description: "Fetch one chunk from a previously chunked webpage manifest.",
      inputSchema: {
        url: z.string().url().describe("Absolute URL for the original page."),
        chunk_id: z.string().min(1).describe("Chunk ID from read_website manifest output."),
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
