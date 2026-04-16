import type { InMemoryCacheStore } from "../cache/cacheStore.js";
import type { ReadWebsiteChunkArgs, ReadWebsiteChunkResponse } from "../types/api.js";
import { AppError } from "../types/errors.js";
import { validateUrl } from "../fetch/validateUrl.js";
import { readWebsite } from "./readWebsite.js";
import type { AppConfig } from "../types/config.js";

type ReadWebsiteChunkDeps = {
  config: AppConfig;
  cache: InMemoryCacheStore;
};

export async function readWebsiteChunk(
  args: ReadWebsiteChunkArgs,
  deps: ReadWebsiteChunkDeps,
): Promise<ReadWebsiteChunkResponse> {
  const normalizedUrl = validateUrl(args.url, deps.config.security.allowPrivateHosts).toString();

  let entry = deps.cache.get(normalizedUrl);
  if (!entry) {
    await readWebsite({ url: normalizedUrl, mode: "manifest" }, deps);
    entry = deps.cache.get(normalizedUrl);
  }

  if (!entry) {
    throw new AppError("FETCH_FAILED", "Could not load page for chunk retrieval.", {
      url: normalizedUrl,
    });
  }

  const content = entry.chunkBodies[args.chunk_id];
  const meta = entry.chunks.find((chunk) => chunk.id === args.chunk_id);

  if (!content || !meta) {
    throw new AppError("CHUNK_NOT_FOUND", "Chunk ID was not found for the specified URL.", {
      chunkId: args.chunk_id,
    });
  }

  return {
    url: normalizedUrl,
    finalUrl: entry.finalUrl,
    title: entry.extracted.title,
    chunk: {
      ...meta,
      content,
    },
  };
}
