import type { ChunkMeta } from "../types/chunk.js";
import { splitSentences } from "../util/text.js";

export function summarizeForManifest(markdown: string, chunks: ChunkMeta[]): string | undefined {
  const headings = chunks
    .map((chunk) => chunk.heading)
    .filter((value): value is string => Boolean(value))
    .slice(0, 3);

  if (headings.length > 0) {
    return `Main sections: ${headings.join("; ")}.`;
  }

  const sentences = splitSentences(markdown).slice(0, 3);
  if (sentences.length === 0) {
    return undefined;
  }

  return sentences.join(" ");
}
