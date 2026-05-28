import { useEffect, useMemo, useState } from "react";

type CacheEntry<T> = {
  value: T;
  updatedAt: number;
};

const DEFAULT_TTL = 5 * 60 * 1000;

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readCache<T>(key: string, ttl: number): T | undefined {
  if (!canUseStorage()) return undefined;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return undefined;

    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (!entry || Date.now() - entry.updatedAt > ttl) return undefined;
    return entry.value;
  } catch {
    return undefined;
  }
}

function writeCache<T>(key: string, value: T) {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(
      key,
      JSON.stringify({
        value,
        updatedAt: Date.now(),
      } satisfies CacheEntry<T>),
    );
  } catch {
    // Storage can fail in private mode or when quota is full. Fresh Convex data still works.
  }
}

export function stableCacheKey(namespace: string, value: unknown) {
  return `${namespace}:${stableStringify(value)}`;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;

  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

export function useLocalCache<T>(
  key: string,
  freshValue: T | undefined,
  options?: { ttl?: number; enabled?: boolean },
) {
  const ttl = options?.ttl ?? DEFAULT_TTL;
  const enabled = options?.enabled ?? true;
  const [cachedValue, setCachedValue] = useState<T | undefined>(() =>
    enabled ? readCache<T>(key, ttl) : undefined,
  );

  useEffect(() => {
    if (!enabled) {
      setCachedValue(undefined);
      return;
    }

    setCachedValue(readCache<T>(key, ttl));
  }, [enabled, key, ttl]);

  useEffect(() => {
    if (!enabled || freshValue === undefined) return;
    writeCache(key, freshValue);
    setCachedValue(freshValue);
  }, [enabled, freshValue, key]);

  return useMemo(
    () => ({
      value: freshValue ?? cachedValue,
      hasCachedValue: freshValue === undefined && cachedValue !== undefined,
    }),
    [cachedValue, freshValue],
  );
}
