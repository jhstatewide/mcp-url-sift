import type { ChunkMeta, ChunkWithContent } from "../types/chunk.js";
import type { TokenEstimator } from "../estimate/estimateTokens.js";
import { buildPreview } from "../util/text.js";

type Section = {
  heading?: string;
  content: string;
};

function splitByHeadings(markdown: string): Section[] {
  const lines = markdown.split("\n");
  const sections: Section[] = [];

  let heading: string | undefined;
  let body: string[] = [];

  const flush = (): void => {
    const content = body.join("\n").trim();
    if (!content) {
      return;
    }
    sections.push({ heading, content });
  };

  for (const line of lines) {
    if (/^#{1,6}\s+/.test(line)) {
      flush();
      heading = line.replace(/^#{1,6}\s+/, "").trim();
      body = [line];
      continue;
    }

    body.push(line);
  }

  flush();

  if (sections.length === 0) {
    const content = markdown.trim();
    if (content) {
      sections.push({ content });
    }
  }

  return sections;
}

function splitLargeSection(section: Section, maxTokens: number, estimator: TokenEstimator): Section[] {
  if (estimator.estimate(section.content) <= maxTokens) {
    return [section];
  }

  const paragraphs = section.content.split(/\n\s*\n/);
  if (paragraphs.length <= 1) {
    return [section];
  }

  const chunks: Section[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const next = current ? `${current}\n\n${paragraph}` : paragraph;
    if (current && estimator.estimate(next) > maxTokens) {
      chunks.push({ heading: section.heading, content: current });
      current = paragraph;
      continue;
    }

    current = next;
  }

  if (current) {
    chunks.push({ heading: section.heading, content: current });
  }

  return chunks;
}

function toChunk(
  content: string,
  index: number,
  startOffset: number,
  estimator: TokenEstimator,
  heading?: string,
): ChunkWithContent {
  const endOffset = startOffset + content.length;

  const meta: ChunkMeta = {
    id: `chunk-${index + 1}`,
    heading,
    index,
    estimatedTokens: estimator.estimate(content),
    preview: buildPreview(content),
    startOffset,
    endOffset,
  };

  return { meta, content };
}

export function chunkMarkdown(
  markdown: string,
  maxTokens: number,
  estimator: TokenEstimator,
): ChunkWithContent[] {
  const sections = splitByHeadings(markdown).flatMap((section) =>
    splitLargeSection(section, maxTokens, estimator),
  );

  const chunks: ChunkWithContent[] = [];
  let rolling = "";
  let rollingHeading: string | undefined;
  let charOffset = 0;

  for (const section of sections) {
    const candidate = rolling ? `${rolling}\n\n${section.content}` : section.content;
    if (rolling && estimator.estimate(candidate) > maxTokens) {
      chunks.push(toChunk(rolling, chunks.length, charOffset, estimator, rollingHeading));
      charOffset += rolling.length;
      rolling = section.content;
      rollingHeading = section.heading;
      continue;
    }

    rolling = candidate;
    rollingHeading = rollingHeading ?? section.heading;
  }

  if (rolling) {
    chunks.push(toChunk(rolling, chunks.length, charOffset, estimator, rollingHeading));
  }

  return chunks;
}
