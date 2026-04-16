import { test } from "node:test";
import assert from "node:assert/strict";
import { loadConfig } from "./loadConfig.js";

test("loadConfig applies env overrides", async () => {
  process.env.MCP_URL_SIFT_MAX_RETURN_TOKENS = "1234";
  process.env.MCP_URL_SIFT_INCLUDE_SUMMARY_ON_OVERFLOW = "false";

  const config = await loadConfig();
  assert.equal(config.defaults.maxReturnTokens, 1234);
  assert.equal(config.defaults.includeSummaryOnOverflow, false);

  delete process.env.MCP_URL_SIFT_MAX_RETURN_TOKENS;
  delete process.env.MCP_URL_SIFT_INCLUDE_SUMMARY_ON_OVERFLOW;
});
