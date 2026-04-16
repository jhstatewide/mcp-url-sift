import type { CachedEntry } from "../types/extraction.js";

type StoredEntry = {
  expiresAt: number;
  entry: CachedEntry;
};

export class InMemoryCacheStore {
  private readonly storage = new Map<string, StoredEntry>();
  private readonly ttlMs: number;

  constructor(ttlSeconds: number) {
    this.ttlMs = ttlSeconds * 1000;
  }

  private isExpired(stored: StoredEntry): boolean {
    return Date.now() > stored.expiresAt;
  }

  get(key: string): CachedEntry | undefined {
    const found = this.storage.get(key);
    if (!found) {
      return undefined;
    }

    if (this.isExpired(found)) {
      this.storage.delete(key);
      return undefined;
    }

    return found.entry;
  }

  set(key: string, entry: CachedEntry): void {
    const stored: StoredEntry = {
      entry,
      expiresAt: Date.now() + this.ttlMs,
    };

    this.storage.set(key, stored);
    this.storage.set(entry.finalUrl, stored);
  }
}
