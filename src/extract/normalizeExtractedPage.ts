import type { DefuddleResponse } from "defuddle/node";
import type { ExtractedPage } from "../types/extraction.js";
import { normalizeWhitespace } from "../util/text.js";

export function normalizeExtractedPage(
  sourceUrl: string,
  finalUrl: string,
  result: DefuddleResponse,
): ExtractedPage {
  const markdown = normalizeWhitespace(result.contentMarkdown ?? result.content ?? "");
  const text = normalizeWhitespace(result.content ?? result.contentMarkdown ?? "");

  return {
    url: sourceUrl,
    finalUrl,
    title: result.title || undefined,
    byline: result.author || undefined,
    siteName: result.site || undefined,
    publishedTime: result.published || undefined,
    excerpt: result.description || undefined,
    lang: result.language || undefined,
    markdown,
    text,
    metadata: {
      domain: result.domain,
      favicon: result.favicon,
      image: result.image,
      parseTime: result.parseTime,
      wordCount: result.wordCount,
      extractorType: result.extractorType,
    },
  };
}
