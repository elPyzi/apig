import { createHash } from 'crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'fs';
import { join, resolve } from 'path';
import type { IR } from '@models';
import type { OpenAPIV3 } from 'openapi-types';
import { getVersion } from '@constants';

const CACHE_DIR = resolve('.apig/cache');

export interface CacheMeta {
  etag?: string;
  specHash?: string;
  /**
   * The apig that wrote this entry. The IR shape belongs to a release, so an
   * entry written by another one is discarded rather than trusted — a warm
   * cache would otherwise keep serving the old shape across an upgrade and hide
   * whatever that upgrade fixed.
   */
  apigVersion?: string;
  /** ISO timestamp the entry was written, for `cache.ttl` to measure against. */
  createdAt?: string;
}

/** Whether an entry written at `createdAt` has outlived `ttlMs`. */
export const isExpired = (
  meta: CacheMeta | null,
  ttlMs: number | null,
): boolean => {
  if (ttlMs === null) return false;
  // an entry from before timestamps were recorded has no age to measure, so it
  // is treated as expired rather than kept forever
  if (!meta?.createdAt) return true;

  const age = Date.now() - new Date(meta.createdAt).getTime();
  return Number.isNaN(age) || age > ttlMs;
};

export const CURRENT_CACHE_VERSION = getVersion();

export const inputKey = (input: string): string =>
  createHash('sha256').update(input).digest('hex').slice(0, 16);

const TMP_SUFFIX = '.tmp';

/**
 * Writes a file so a reader never sees it half-written.
 *
 * `writeFileSync` truncates and then fills, so an interrupted write leaves a
 * readable file holding a fragment. Renaming into place is atomic within a
 * filesystem: the reader gets either the previous file whole or the new one
 * whole. The pid keeps two apig runs from colliding on the same scratch name.
 */
const writeAtomic = (path: string, data: string): void => {
  const tmp = `${path}.${process.pid}${TMP_SUFFIX}`;
  try {
    writeFileSync(tmp, data, 'utf-8');
    renameSync(tmp, path);
  } catch (e: unknown) {
    rmSync(tmp, { force: true });
    throw e;
  }
};

const metaPath = (key: string) => join(CACHE_DIR, `${key}.meta.json`);
const irPath = (key: string) => join(CACHE_DIR, `${key}.ir.json`);
const specPath = (key: string) => join(CACHE_DIR, `${key}.spec.json`);

export const readMeta = (key: string): CacheMeta | null => {
  const p = metaPath(key);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf-8')) as CacheMeta;
  } catch {
    return null;
  }
};

export const readIR = (key: string): IR | null => {
  const p = irPath(key);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf-8')) as IR;
  } catch {
    return null;
  }
};

/**
 * The spec as it was parsed.
 *
 * A cache hit used to hand back an empty document, and versioning takes the API
 * version and the saved spec from it — so every snapshot written off a warm
 * cache was recorded as "unknown" with a two-byte spec.
 */
export const readSpec = (key: string): OpenAPIV3.Document | null => {
  const p = specPath(key);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf-8')) as OpenAPIV3.Document;
  } catch {
    return null;
  }
};

/**
 * Stores an entry, reporting why if it could not.
 *
 * The cache is an optimization, so a read-only `.apig`, a full disk or a
 * locked-down container must not take the generation down with it — an
 * unguarded write here failed the whole run before a single file was emitted.
 * A half-written entry is left for `usableEntry` to reject on the next read.
 */
export const writeCacheFiles = (
  key: string,
  ir: IR,
  meta: CacheMeta,
  spec?: OpenAPIV3.Document,
): { ok: true } | { ok: false; reason: string } => {
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    writeAtomic(irPath(key), JSON.stringify(ir));
    if (spec) writeAtomic(specPath(key), JSON.stringify(spec));
    // written last on purpose: the entry only becomes usable once its data is
    // already in place
    writeAtomic(
      metaPath(key),
      JSON.stringify({
        ...meta,
        apigVersion: CURRENT_CACHE_VERSION,
        createdAt: new Date().toISOString(),
      }),
    );
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e) };
  }
};

/** Drops entries older than `ttlMs`, including ones nothing asks for any more. */
export const purgeExpired = (ttlMs: number | null): number => {
  if (ttlMs === null || !existsSync(CACHE_DIR)) return 0;

  let removed = 0;
  let entries: string[];
  try {
    entries = readdirSync(CACHE_DIR);
  } catch {
    // unreadable cache directory — nothing to sweep, and not worth failing over
    return 0;
  }

  for (const file of entries) {
    if (!file.endsWith('.meta.json')) continue;

    const key = file.slice(0, -'.meta.json'.length);
    if (!isExpired(readMeta(key), ttlMs)) continue;

    try {
      for (const path of [metaPath(key), irPath(key), specPath(key)]) {
        rmSync(path, { force: true });
      }
      removed++;
    } catch {
      // left in place; the entry stays expired and is skipped on read anyway
    }
  }

  return removed;
};

export interface CacheSummary {
  /** Directory the entries live in — always relative to where apig was run. */
  dir: string;
  /** Distinct inputs cached, not files: each entry is an IR, a spec and a meta. */
  entries: number;
  bytes: number;
}

/** What is currently cached, without touching it. */
export const inspectCache = (): CacheSummary => {
  const summary: CacheSummary = { dir: CACHE_DIR, entries: 0, bytes: 0 };
  if (!existsSync(CACHE_DIR)) return summary;

  let files: string[];
  try {
    files = readdirSync(CACHE_DIR);
  } catch {
    // `apig cache status` answers a question; an unreadable directory is an
    // answer of "nothing", not a crash
    return summary;
  }

  for (const file of files) {
    // scratch files from a run that was killed mid-write are not part of what
    // is cached
    if (file.endsWith(TMP_SUFFIX)) continue;
    if (file.endsWith('.ir.json')) summary.entries++;
    try {
      summary.bytes += statSync(join(CACHE_DIR, file)).size;
    } catch {
      // vanished between listing and stat — nothing to count
    }
  }

  return summary;
};

/** Removes every cached entry. The next run parses the spec again. */
export const clearCache = (): CacheSummary => {
  const summary = inspectCache();
  rmSync(CACHE_DIR, { recursive: true, force: true });
  return summary;
};

/**
 * Keeps the newest `max` entries and removes the rest.
 *
 * An entry with no timestamp — written before they were recorded, or with an
 * unreadable meta — counts as the oldest, so it is the first to go.
 */
export const enforceMaxEntries = (max: number | null): number => {
  if (max === null || !existsSync(CACHE_DIR)) return 0;

  let files: string[];
  try {
    files = readdirSync(CACHE_DIR);
  } catch {
    return 0;
  }

  const entries = files
    .filter((file) => file.endsWith('.meta.json'))
    .map((file) => {
      const key = file.slice(0, -'.meta.json'.length);
      return { key, createdAt: readMeta(key)?.createdAt ?? '' };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  let removed = 0;
  for (const { key } of entries.slice(max)) {
    try {
      for (const path of [metaPath(key), irPath(key), specPath(key)]) {
        rmSync(path, { force: true });
      }
      removed++;
    } catch {
      // left in place; the limit is a bound, not a guarantee worth failing over
    }
  }

  return removed;
};
