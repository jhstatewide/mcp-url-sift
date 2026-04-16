import { Defuddle, type DefuddleOptions, type DefuddleResponse } from "defuddle/node";
import { AppError } from "../types/errors.js";

export async function extractWithDefuddle(
  html: string,
  finalUrl: string,
  options: DefuddleOptions = {},
): Promise<DefuddleResponse> {
  try {
    return await Defuddle(html, finalUrl, {
      markdown: true,
      separateMarkdown: true,
      ...options,
    });
  } catch (error) {
    throw new AppError("EXTRACTION_FAILED", "Failed to extract content from HTML.", {
      reason: error instanceof Error ? error.message : String(error),
    });
  }
}
