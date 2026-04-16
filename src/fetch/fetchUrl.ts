import { AppError } from "../types/errors.js";

type FetchUrlOptions = {
  requestTimeoutMs: number;
  userAgent: string;
  maxResponseBytes: number;
};

export type FetchResult = {
  url: string;
  finalUrl: string;
  html: string;
  contentType: string;
};

async function readResponseTextWithLimit(response: Response, maxBytes: number): Promise<string> {
  const contentLength = response.headers.get("content-length");
  if (contentLength) {
    const declared = Number.parseInt(contentLength, 10);
    if (Number.isFinite(declared) && declared > maxBytes) {
      throw new AppError("PAGE_TOO_LARGE", "Response body exceeds configured size limit.", {
        declaredBytes: declared,
        maxBytes,
      });
    }
  }

  const body = response.body;
  if (!body) {
    const text = await response.text();
    if (Buffer.byteLength(text, "utf8") > maxBytes) {
      throw new AppError("PAGE_TOO_LARGE", "Response body exceeds configured size limit.", {
        maxBytes,
      });
    }
    return text;
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let result = "";
  let totalBytes = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      throw new AppError("PAGE_TOO_LARGE", "Response body exceeds configured size limit.", {
        maxBytes,
      });
    }

    result += decoder.decode(value, { stream: true });
  }

  result += decoder.decode();
  return result;
}

export async function fetchUrl(url: string, options: FetchUrlOptions): Promise<FetchResult> {
  const signal = AbortSignal.timeout(options.requestTimeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      redirect: "follow",
      signal,
      headers: {
        "user-agent": options.userAgent,
        accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
      },
    });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      throw new AppError("FETCH_TIMEOUT", "Request timed out while fetching URL.", {
        requestTimeoutMs: options.requestTimeoutMs,
      });
    }

    throw new AppError("FETCH_FAILED", "Could not fetch URL.", {
      reason: error instanceof Error ? error.message : String(error),
    });
  }

  if (!response.ok) {
    throw new AppError("FETCH_FAILED", `Fetch failed with status ${response.status}.`, {
      status: response.status,
      statusText: response.statusText,
    });
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
    throw new AppError("UNSUPPORTED_CONTENT_TYPE", "Only HTML content is supported.", {
      contentType,
    });
  }

  const html = await readResponseTextWithLimit(response, options.maxResponseBytes);

  return {
    url,
    finalUrl: response.url || url,
    html,
    contentType,
  };
}
