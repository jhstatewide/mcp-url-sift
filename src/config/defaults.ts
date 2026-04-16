import type { AppConfig } from "../types/config.js";

export const DEFAULT_CONFIG: AppConfig = {
  projectName: "mcp-url-sift",
  server: {
    requestTimeoutMs: 15000,
    userAgent: "mcp-url-sift/0.1.0",
    maxResponseBytes: 2_500_000,
  },
  defaults: {
    mode: "auto",
    maxReturnTokens: 1800,
    maxChunkTokens: 900,
    includeSummaryOnOverflow: true,
    includeRecommendedChunk: true,
  },
  limits: {
    hardMaxReturnTokens: 2500,
    hardMaxChunkTokens: 1200,
  },
  estimation: {
    safetyMarginPercent: 20,
  },
  cache: {
    enabled: true,
    ttlSeconds: 3600,
  },
  security: {
    allowPrivateHosts: false,
  },
  perDomain: {},
};
