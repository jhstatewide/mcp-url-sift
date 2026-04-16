import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

type ManifestResponse = {
  delivery: "manifest";
  url: string;
  finalUrl: string;
  chunks: Array<{ id: string }>;
  recommended_chunk_id?: string;
};

type ChunkResponse = {
  url: string;
  finalUrl: string;
  chunk: {
    id: string;
    content: string;
  };
};

function asRecord(value: unknown): Record<string, unknown> {
  assert.equal(typeof value, "object");
  assert.notEqual(value, null);
  return value as Record<string, unknown>;
}

async function run(): Promise<void> {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["dist/server.js"],
    cwd: process.cwd(),
    stderr: "pipe",
  });

  const stderrChunks: string[] = [];
  transport.stderr?.on("data", (chunk: Buffer | string) => {
    stderrChunks.push(chunk.toString());
  });

  const client = new Client({
    name: "mcp-url-sift-smoke",
    version: "0.1.0",
  });

  try {
    await client.connect(transport);

    const tools = await client.listTools();
    const toolNames = tools.tools.map((tool) => tool.name);
    assert.ok(toolNames.includes("read_website"), "read_website tool is missing");
    assert.ok(toolNames.includes("read_website_chunk"), "read_website_chunk tool is missing");

    const manifestResult = await client.callTool({
      name: "read_website",
      arguments: {
        url: "https://example.com",
        mode: "manifest",
        max_chunk_tokens: 200,
      },
    });

    assert.equal(manifestResult.isError, undefined, "read_website returned error");
    const manifest = asRecord(manifestResult.structuredContent) as unknown as ManifestResponse;
    assert.equal(manifest.delivery, "manifest");
    assert.ok(Array.isArray(manifest.chunks), "manifest chunks must be an array");
    assert.ok(manifest.chunks.length > 0, "manifest should contain at least one chunk");

    const chunkId = manifest.recommended_chunk_id ?? manifest.chunks[0]?.id;
    assert.ok(chunkId, "could not select chunk id from manifest");

    const chunkResult = await client.callTool({
      name: "read_website_chunk",
      arguments: {
        url: "https://example.com",
        chunk_id: chunkId,
      },
    });

    assert.equal(chunkResult.isError, undefined, "read_website_chunk returned error");
    const chunkPayload = asRecord(chunkResult.structuredContent) as unknown as ChunkResponse;
    assert.equal(chunkPayload.chunk.id, chunkId);
    assert.ok(chunkPayload.chunk.content.trim().length > 0, "chunk content should not be empty");

    process.stdout.write("MCP smoke test passed: tools listed and both calls succeeded.\n");
  } catch (error) {
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    process.stderr.write(`MCP smoke test failed: ${message}\n`);
    if (stderrChunks.length > 0) {
      process.stderr.write("Server stderr:\n");
      process.stderr.write(stderrChunks.join(""));
      process.stderr.write("\n");
    }
    process.exitCode = 1;
  } finally {
    await transport.close();
  }
}

run();
