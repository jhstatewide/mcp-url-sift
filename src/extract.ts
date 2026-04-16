import {
  Defuddle,
  type DefuddleOptions,
  type DefuddleResponse,
} from "defuddle/node";

type DefuddleInput = Parameters<typeof Defuddle>[0];

export function extractContent(
  input: DefuddleInput,
  url?: string,
  options: DefuddleOptions = {},
): Promise<DefuddleResponse> {
  return Defuddle(input, url, options);
}

export async function extractUrl(
  url: string,
  options: DefuddleOptions = {},
): Promise<DefuddleResponse> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to fetch URL (${response.status} ${response.statusText})`);
  }

  const html = await response.text();
  return extractContent(html, url, options);
}
