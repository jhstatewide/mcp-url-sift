export type {
  ReadWebsiteArgs,
  ReadWebsiteChunkArgs,
  ReadWebsiteChunkResponse,
  ReadWebsiteResponse,
} from "./types/api.js";

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("mcp-url-sift is ready. Run npm run mcp:dev for MCP server mode.");
}
