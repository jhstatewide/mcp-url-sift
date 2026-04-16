import { isIP } from "node:net";
import { AppError } from "../types/errors.js";

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [a, b] = parts;
  return (
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a === 127 ||
    (a === 169 && b === 254)
  );
}

function isPrivateHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower.endsWith(".localhost") || lower.endsWith(".local")) {
    return true;
  }

  const ipType = isIP(lower);
  if (ipType === 4) {
    return isPrivateIpv4(lower);
  }

  if (ipType === 6) {
    return lower === "::1" || lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80:");
  }

  return false;
}

export function validateUrl(input: string, allowPrivateHosts: boolean): URL {
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    throw new AppError("INVALID_URL", "URL must be valid and absolute.", { input });
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new AppError("INVALID_URL", "Only http and https URLs are supported.", {
      protocol: parsed.protocol,
    });
  }

  if (!allowPrivateHosts && isPrivateHost(parsed.hostname)) {
    throw new AppError("INVALID_URL", "Private and local network targets are blocked.", {
      hostname: parsed.hostname,
    });
  }

  parsed.hash = "";
  return parsed;
}
