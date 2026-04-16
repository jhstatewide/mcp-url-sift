import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { DEFAULT_CONFIG } from "./defaults.js";
import { readEnvConfigOverrides } from "./env.js";
import type { AppConfig } from "../types/config.js";

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

function deepMerge<T extends object>(base: T, patch: DeepPartial<T>): T {
  const output = { ...(base as Record<string, unknown>) };

  for (const key of Object.keys(patch) as Array<keyof T>) {
    const patchValue = patch[key];
    if (patchValue === undefined) {
      continue;
    }

    const baseValue = base[key];
    if (
      baseValue &&
      patchValue &&
      typeof baseValue === "object" &&
      typeof patchValue === "object" &&
      !Array.isArray(baseValue) &&
      !Array.isArray(patchValue)
    ) {
      output[key as string] = deepMerge(
        baseValue as Record<string, unknown>,
        patchValue as DeepPartial<Record<string, unknown>>,
      );
      continue;
    }

    output[key as string] = patchValue;
  }

  return output as T;
}

function clampConfig(config: AppConfig): AppConfig {
  const hardMaxReturnTokens = Math.max(200, config.limits.hardMaxReturnTokens);
  const hardMaxChunkTokens = Math.max(100, config.limits.hardMaxChunkTokens);

  return {
    ...config,
    server: {
      ...config.server,
      requestTimeoutMs: Math.max(1000, config.server.requestTimeoutMs),
      maxResponseBytes: Math.max(32_000, config.server.maxResponseBytes),
    },
    defaults: {
      ...config.defaults,
      maxReturnTokens: Math.min(Math.max(100, config.defaults.maxReturnTokens), hardMaxReturnTokens),
      maxChunkTokens: Math.min(Math.max(50, config.defaults.maxChunkTokens), hardMaxChunkTokens),
    },
    limits: {
      hardMaxReturnTokens,
      hardMaxChunkTokens,
    },
    estimation: {
      safetyMarginPercent: Math.min(Math.max(0, config.estimation.safetyMarginPercent), 100),
    },
    cache: {
      ...config.cache,
      ttlSeconds: Math.max(1, config.cache.ttlSeconds),
    },
  };
}

async function loadConfigFile(path: string): Promise<DeepPartial<AppConfig>> {
  if (!existsSync(path)) {
    return {};
  }

  const raw = await readFile(path, "utf8");
  const parsed = JSON.parse(raw) as DeepPartial<AppConfig>;
  return parsed;
}

export async function loadConfig(): Promise<AppConfig> {
  const configPath = process.env.MCP_URL_SIFT_CONFIG_PATH ?? "mcp-url-sift.config.json";

  const fileConfig = await loadConfigFile(configPath);
  const envConfig = readEnvConfigOverrides();
  const merged = deepMerge(deepMerge(DEFAULT_CONFIG, fileConfig), envConfig);
  return clampConfig(merged);
}

export type { DeepPartial };
