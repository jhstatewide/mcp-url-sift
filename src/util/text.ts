export function normalizeWhitespace(text: string): string {
  const normalizedNewlines = text.replace(/\r\n?/g, "\n");
  const collapsedBlankLines = normalizedNewlines.replace(/\n{3,}/g, "\n\n");
  return collapsedBlankLines.trim();
}

export function buildPreview(text: string, maxLength = 160): string {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) {
    return compact;
  }

  return `${compact.slice(0, maxLength - 1)}...`;
}

export function splitSentences(text: string): string[] {
  const compact = text.replace(/\s+/g, " ").trim();
  if (!compact) {
    return [];
  }

  return compact.split(/(?<=[.!?])\s+/);
}
