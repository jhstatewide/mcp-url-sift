import type { ChunkMeta } from "./chunk.js";

export type ExtractedPage = {
  url: string;
  finalUrl: string;
  title?: string;
  byline?: string;
  siteName?: string;
  publishedTime?: string;
  excerpt?: string;
  lang?: string;
  markdown: string;
  text: string;
  metadata: Record<string, unknown>;
};

export type CachedEntry = {
  url: string;
  finalUrl: string;
  fetchedAt: string;
  extracted: ExtractedPage;
  estimatedTokens: number;
  chunks: ChunkMeta[];
  chunkBodies: Record<string, string>;
};
