import type { ReadMode } from "./api.js";

export type DomainOverrides = {
  maxReturnTokens?: number;
  maxChunkTokens?: number;
  mode?: ReadMode;
};

export type AppConfig = {
  projectName: string;
  server: {
    requestTimeoutMs: number;
    userAgent: string;
    maxResponseBytes: number;
  };
  defaults: {
    mode: ReadMode;
    maxReturnTokens: number;
    maxChunkTokens: number;
    includeSummaryOnOverflow: boolean;
    includeRecommendedChunk: boolean;
  };
  limits: {
    hardMaxReturnTokens: number;
    hardMaxChunkTokens: number;
  };
  estimation: {
    safetyMarginPercent: number;
  };
  cache: {
    enabled: boolean;
    ttlSeconds: number;
  };
  security: {
    allowPrivateHosts: boolean;
  };
  perDomain: Record<string, DomainOverrides>;
};
