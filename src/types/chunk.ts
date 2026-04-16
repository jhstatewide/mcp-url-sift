export type ChunkMeta = {
  id: string;
  heading?: string;
  index: number;
  estimatedTokens: number;
  preview: string;
  startOffset: number;
  endOffset: number;
};

export type ChunkWithContent = {
  meta: ChunkMeta;
  content: string;
};
