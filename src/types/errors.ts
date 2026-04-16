export type ErrorCode =
  | "FETCH_FAILED"
  | "FETCH_TIMEOUT"
  | "UNSUPPORTED_CONTENT_TYPE"
  | "DOM_PARSE_FAILED"
  | "EXTRACTION_FAILED"
  | "PAGE_TOO_LARGE"
  | "CHUNK_NOT_FOUND"
  | "INVALID_URL";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}

export function toErrorPayload(error: unknown, url?: string): {
  error: {
    code: ErrorCode;
    message: string;
    url?: string;
    details?: Record<string, unknown>;
  };
} {
  if (isAppError(error)) {
    return {
      error: {
        code: error.code,
        message: error.message,
        url,
        details: error.details,
      },
    };
  }

  const message = error instanceof Error ? error.message : String(error);
  return {
    error: {
      code: "FETCH_FAILED",
      message,
      url,
    },
  };
}
