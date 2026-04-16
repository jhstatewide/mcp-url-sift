import type { ChunkMeta } from "./chunk.js";

export type ReadMode = "auto" | "full" | "summary" | "manifest";

export type ReadWebsiteArgs = {
  url: string;
  mode?: ReadMode;
  max_return_tokens?: number;
  max_chunk_tokens?: number;
};

export type ReadWebsiteResponse =
  | {
      delivery: "full";
      url: string;
      finalUrl: string;
      title?: string;
      estimatedTokens: number;
      content: string;
    }
  | {
      delivery: "manifest";
      url: string;
      finalUrl: string;
      title?: string;
      estimatedTokens: number;
      summary?: string;
      recommended_chunk_id?: string;
      chunks: ChunkMeta[];
    };

export type ReadWebsiteChunkArgs = {
  url: string;
  chunk_id: string;
};

export type ReadWebsiteChunkResponse = {
  url: string;
  finalUrl: string;
  title?: string;
  chunk: ChunkMeta & {
    content: string;
  };
};
