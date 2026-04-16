import type { AppConfig } from "../types/config.js";

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

function parseIntEnv(name: string): number | undefined {
  const value = process.env[name];
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseBoolEnv(name: string): boolean | undefined {
  const value = process.env[name];
  if (!value) {
    return undefined;
  }

  if (value === "1" || value.toLowerCase() === "true") {
    return true;
  }

  if (value === "0" || value.toLowerCase() === "false") {
    return false;
  }

  return undefined;
}

export function readEnvConfigOverrides(): DeepPartial<AppConfig> {
  const maxReturnTokens = parseIntEnv("MCP_URL_SIFT_MAX_RETURN_TOKENS");
  const maxChunkTokens = parseIntEnv("MCP_URL_SIFT_MAX_CHUNK_TOKENS");
  const timeoutMs = parseIntEnv("MCP_URL_SIFT_TIMEOUT_MS");
  const cacheTtl = parseIntEnv("MCP_URL_SIFT_CACHE_TTL_SECONDS");
  const safetyMarginPercent = parseIntEnv("MCP_URL_SIFT_SAFETY_MARGIN_PERCENT");
  const hardMaxReturnTokens = parseIntEnv("MCP_URL_SIFT_HARD_MAX_RETURN_TOKENS");
  const hardMaxChunkTokens = parseIntEnv("MCP_URL_SIFT_HARD_MAX_CHUNK_TOKENS");
  const maxResponseBytes = parseIntEnv("MCP_URL_SIFT_MAX_RESPONSE_BYTES");
  const cacheEnabled = parseBoolEnv("MCP_URL_SIFT_CACHE_ENABLED");
  const allowPrivateHosts = parseBoolEnv("MCP_URL_SIFT_ALLOW_PRIVATE_HOSTS");
  const includeSummaryOnOverflow = parseBoolEnv("MCP_URL_SIFT_INCLUDE_SUMMARY_ON_OVERFLOW");
  const includeRecommendedChunk = parseBoolEnv("MCP_URL_SIFT_INCLUDE_RECOMMENDED_CHUNK");

  return {
    server: {
      requestTimeoutMs: timeoutMs ?? undefined,
      userAgent: process.env.MCP_URL_SIFT_USER_AGENT,
      maxResponseBytes: maxResponseBytes ?? undefined,
    },
    defaults: {
      mode: process.env.MCP_URL_SIFT_MODE as AppConfig["defaults"]["mode"] | undefined,
      maxReturnTokens: maxReturnTokens ?? undefined,
      maxChunkTokens: maxChunkTokens ?? undefined,
      includeSummaryOnOverflow: includeSummaryOnOverflow ?? undefined,
      includeRecommendedChunk: includeRecommendedChunk ?? undefined,
    },
    limits: {
      hardMaxReturnTokens: hardMaxReturnTokens ?? undefined,
      hardMaxChunkTokens: hardMaxChunkTokens ?? undefined,
    },
    estimation: {
      safetyMarginPercent: safetyMarginPercent ?? undefined,
    },
    cache: {
      enabled: cacheEnabled ?? undefined,
      ttlSeconds: cacheTtl ?? undefined,
    },
    security: {
      allowPrivateHosts: allowPrivateHosts ?? undefined,
    },
  };
}
