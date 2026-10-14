import type { ApigConfig, IR } from '@models';
import type { OpenAPIV3 } from 'openapi-types';
import { parseDuration } from '@libs/duration';
import { inputKey, writeCacheFiles } from './storage';

export interface CacheSettings {
  enabled: boolean;
  /** Entry lifetime in milliseconds, or `null` when entries never expire. */
  ttlMs: number | null;
  /** How many entries to keep, or `null` for no limit. */
  maxEntries: number | null;
}

/**
 * Reads `cache` in either of its forms.
 *
 * An object turns the cache on by itself, so `cache: { ttl: "7d" }` needs no
 * separate flag. An unparseable ttl is rejected by config validation before
 * this runs, so it degrades to "no expiry" rather than throwing here.
 */
export const getCacheSettings = (config: ApigConfig): CacheSettings => {
  const cache = config.cache;
  if (!cache) return { enabled: false, ttlMs: null, maxEntries: null };
  if (cache === true) return { enabled: true, ttlMs: null, maxEntries: null };

  return {
    enabled: true,
    ttlMs: cache.ttl ? parseDuration(cache.ttl) : null,
    maxEntries: cache.maxEntries ?? null,
  };
};

export { fetchWithCache } from './fetch';
export { clearCache, inspectCache, enforceMaxEntries } from './storage';
export type { CacheSummary } from './storage';
export type { CacheResult } from './fetch';

export const saveCache = (
  input: string,
  ir: IR,
  etag: string | undefined,
  specHash: string | undefined,
  spec: OpenAPIV3.Document,
): { ok: true } | { ok: false; reason: string } =>
  writeCacheFiles(inputKey(input), ir, { etag, specHash }, spec);
