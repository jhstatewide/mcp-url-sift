import { chunkMarkdown } from "../chunk/chunkMarkdown.js";
import { summarizeForManifest } from "../chunk/summarizeChunk.js";
import { InMemoryCacheStore } from "../cache/cacheStore.js";
import type { AppConfig } from "../types/config.js";
import type { ReadWebsiteArgs, ReadWebsiteResponse } from "../types/api.js";
import type { CachedEntry } from "../types/extraction.js";
import { extractWithDefuddle } from "../extract/extractWithDefuddle.js";
import { normalizeExtractedPage } from "../extract/normalizeExtractedPage.js";
import { RoughTokenEstimator } from "../estimate/estimateTokens.js";
import { fetchUrl } from "../fetch/fetchUrl.js";
import { validateUrl } from "../fetch/validateUrl.js";
import { logEvent } from "../util/logging.js";
import { AppError } from "../types/errors.js";

function getDomainOverrides(config: AppConfig, url: URL): Partial<AppConfig["defaults"]> {
  const domain = url.hostname.toLowerCase();
  const match = config.perDomain[domain];
  if (!match) {
    return {};
  }

  return {
    mode: match.mode,
    maxReturnTokens: match.maxReturnTokens,
    maxChunkTokens: match.maxChunkTokens,
  };
}

function buildCachedEntry(
  sourceUrl: string,
  finalUrl: string,
  markdown: string,
  extracted: CachedEntry["extracted"],
  estimatedTokens: number,
  maxChunkTokens: number,
  estimator: RoughTokenEstimator,
): CachedEntry {
  const chunks = chunkMarkdown(markdown, maxChunkTokens, estimator);

  return {
    url: sourceUrl,
    finalUrl,
    fetchedAt: new Date().toISOString(),
    extracted,
    estimatedTokens,
    chunks: chunks.map((chunk) => chunk.meta),
    chunkBodies: Object.fromEntries(chunks.map((chunk) => [chunk.meta.id, chunk.content])),
  };
}

type ReadWebsiteDeps = {
  config: AppConfig;
  cache: InMemoryCacheStore;
};

export async function readWebsite(
  args: ReadWebsiteArgs,
  deps: ReadWebsiteDeps,
): Promise<ReadWebsiteResponse> {
  const normalizedUrl = validateUrl(args.url, deps.config.security.allowPrivateHosts);
  const sourceUrl = normalizedUrl.toString();
  const domainDefaults = getDomainOverrides(deps.config, normalizedUrl);
  const effectiveMode = args.mode ?? domainDefaults.mode ?? deps.config.defaults.mode;

  const maxReturnTokens = Math.min(
    args.max_return_tokens ?? domainDefaults.maxReturnTokens ?? deps.config.defaults.maxReturnTokens,
    deps.config.limits.hardMaxReturnTokens,
  );
  const maxChunkTokens = Math.min(
    args.max_chunk_tokens ?? domainDefaults.maxChunkTokens ?? deps.config.defaults.maxChunkTokens,
    deps.config.limits.hardMaxChunkTokens,
  );

  const estimator = new RoughTokenEstimator(deps.config.estimation.safetyMarginPercent);
  let entry = deps.config.cache.enabled ? deps.cache.get(sourceUrl) : undefined;
  const cacheHit = Boolean(entry);

  if (!entry) {
    logEvent("read_website_fetch_started", { url: sourceUrl });
    const fetched = await fetchUrl(sourceUrl, deps.config.server);
    const defuddled = await extractWithDefuddle(fetched.html, fetched.finalUrl);
    const normalized = normalizeExtractedPage(sourceUrl, fetched.finalUrl, defuddled);
    if (!normalized.markdown) {
      throw new AppError(
        "EXTRACTION_FAILED",
        "Could not extract a usable main-content body from this page.",
      );
    }
    const estimatedTokens = estimator.estimate(normalized.markdown);

    entry = buildCachedEntry(
      sourceUrl,
      fetched.finalUrl,
      normalized.markdown,
      normalized,
      estimatedTokens,
      maxChunkTokens,
      estimator,
    );

    deps.cache.set(sourceUrl, entry);
  }

  if (effectiveMode === "full" && entry.estimatedTokens > deps.config.limits.hardMaxReturnTokens) {
    throw new AppError("PAGE_TOO_LARGE", "Page exceeds hard token cap for full delivery.", {
      estimatedTokens: entry.estimatedTokens,
      hardMaxReturnTokens: deps.config.limits.hardMaxReturnTokens,
    });
  }

  const shouldReturnManifest =
    effectiveMode === "manifest" ||
    effectiveMode === "summary" ||
    (effectiveMode === "auto" && entry.estimatedTokens > maxReturnTokens);

  const response: ReadWebsiteResponse = shouldReturnManifest
    ? {
        delivery: "manifest",
        url: sourceUrl,
        finalUrl: entry.finalUrl,
        title: entry.extracted.title,
        estimatedTokens: entry.estimatedTokens,
        summary: deps.config.defaults.includeSummaryOnOverflow
          ? summarizeForManifest(entry.extracted.markdown, entry.chunks)
          : undefined,
        recommended_chunk_id: deps.config.defaults.includeRecommendedChunk
          ? entry.chunks[0]?.id
          : undefined,
        chunks: entry.chunks,
      }
    : {
        delivery: "full",
        url: sourceUrl,
        finalUrl: entry.finalUrl,
        title: entry.extracted.title,
        estimatedTokens: entry.estimatedTokens,
        content: entry.extracted.markdown,
      };

  logEvent("read_website_completed", {
    url: sourceUrl,
    finalUrl: entry.finalUrl,
    estimatedTokens: entry.estimatedTokens,
    delivery: response.delivery,
    chunkCount: entry.chunks.length,
    cacheHit,
  });

  return response;
}
