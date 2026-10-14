import { describe, test, expect, beforeEach, afterAll } from 'bun:test';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
  unlinkSync,
  readFileSync,
} from 'fs';
import { dirname } from 'path';
import { join, resolve } from 'path';
import type { IR } from '@models';
import type { OpenAPIV3 } from 'openapi-types';

import { fetchWithCache, clearCache, inspectCache } from '@services/cache';
import {
  inputKey,
  writeCacheFiles,
  readSpec,
  isExpired,
  purgeExpired,
  enforceMaxEntries,
} from '@services/cache/storage';
import { getCacheSettings } from '@services/cache';
import { CURRENT_CACHE_VERSION } from '@services/cache/storage';

const CACHE_DIR = resolve('.apig/cache');
const SCRATCH = resolve('.apig-cache-test');
const SPEC_FILE = join(SCRATCH, 'spec.json');

const spec = {
  openapi: '3.0.0',
  info: { title: 'T', version: '4.2.0' },
  paths: {},
} as unknown as OpenAPIV3.Document;
const ir: IR = { operations: [], schemas: [] };

const seed = (): string => {
  mkdirSync(SCRATCH, { recursive: true });
  writeFileSync(SPEC_FILE, JSON.stringify(spec), 'utf-8');
  return SPEC_FILE;
};

beforeEach(() => {
  rmSync(CACHE_DIR, { recursive: true, force: true });
  rmSync(SCRATCH, { recursive: true, force: true });
});

afterAll(() => {
  rmSync(CACHE_DIR, { recursive: true, force: true });
  rmSync(SCRATCH, { recursive: true, force: true });
});

describe('fetchWithCache', () => {
  test('misses when nothing has been cached', async () => {
    const result = await fetchWithCache(seed());
    expect(result.hit).toBe(false);
  });

  test('hits once the IR and the spec are both stored', async () => {
    const input = seed();
    const text = JSON.stringify(spec);
    const specHash = new Bun.CryptoHasher('sha256').update(text).digest('hex');
    writeCacheFiles(inputKey(input), ir, { specHash }, spec);

    const result = await fetchWithCache(input);
    expect(result.hit).toBe(true);
  });

  test('hands back the spec, not an empty document', async () => {
    const input = seed();
    const text = JSON.stringify(spec);
    const specHash = new Bun.CryptoHasher('sha256').update(text).digest('hex');
    writeCacheFiles(inputKey(input), ir, { specHash }, spec);

    const result = await fetchWithCache(input);
    // versioning reads info.version off this; an empty document recorded every
    // snapshot taken off a warm cache as "unknown"
    expect(result.hit && result.spec.info.version).toBe('4.2.0');
  });

  test('misses when the spec changed', async () => {
    const input = seed();
    writeCacheFiles(inputKey(input), ir, { specHash: 'stale' }, spec);

    const result = await fetchWithCache(input);
    expect(result.hit).toBe(false);
  });

  test('misses when a different apig wrote the entry', async () => {
    const input = seed();
    const text = JSON.stringify(spec);
    const specHash = new Bun.CryptoHasher('sha256').update(text).digest('hex');
    const key = inputKey(input);
    writeCacheFiles(key, ir, { specHash }, spec);

    // the IR shape belongs to a release, so an entry from another one is not
    // trusted — a warm cache would otherwise hide what an upgrade fixed
    writeFileSync(
      join(CACHE_DIR, `${key}.meta.json`),
      JSON.stringify({ specHash, apigVersion: '0.0.1-other' }),
      'utf-8',
    );

    const result = await fetchWithCache(input);
    expect(result.hit).toBe(false);
  });

  test('misses when the entry is only half there', async () => {
    const input = seed();
    const text = JSON.stringify(spec);
    const specHash = new Bun.CryptoHasher('sha256').update(text).digest('hex');
    const key = inputKey(input);
    writeCacheFiles(key, ir, { specHash }, spec);

    // a cleared *.ir.json, an interrupted write, a partially restored CI cache
    unlinkSync(join(CACHE_DIR, `${key}.ir.json`));

    const result = await fetchWithCache(input);
    expect(result.hit).toBe(false);
  });
});

describe('cache storage', () => {
  test('keeps entries for different inputs apart', () => {
    expect(inputKey('./a.json')).not.toBe(inputKey('./b.json'));
  });

  test('stores the spec alongside the IR', () => {
    const key = inputKey('./x.json');
    writeCacheFiles(key, ir, {}, spec);

    expect(existsSync(join(CACHE_DIR, `${key}.spec.json`))).toBe(true);
    expect(readSpec(key)?.info.version).toBe('4.2.0');
  });
});

describe('atomic writes', () => {
  test('leaves no scratch files behind', () => {
    writeCacheFiles(inputKey('./x.json'), ir, {}, spec);

    expect(readdirSync(CACHE_DIR).filter((f) => f.endsWith('.tmp'))).toEqual(
      [],
    );
  });

  test('a replaced entry is never observable half-written', () => {
    const key = inputKey('./x.json');
    writeCacheFiles(key, ir, { specHash: 'first' }, spec);

    const bigger: IR = {
      operations: Array.from({ length: 500 }, (_, i) => ({
        operationId: `op${i}`,
      })) as unknown as IR['operations'],
      schemas: [],
    };
    writeCacheFiles(key, bigger, { specHash: 'second' }, spec);

    // a rename swaps the whole file: what a reader gets is one version or the
    // other, never a truncated prefix of the new one
    const stored = JSON.parse(
      readFileSync(join(CACHE_DIR, `${key}.ir.json`), 'utf-8'),
    ) as IR;
    expect(stored.operations).toHaveLength(500);
  });

  test('a stranded scratch file is not counted as an entry', () => {
    writeCacheFiles(inputKey('./x.json'), ir, {}, spec);
    // what a run killed mid-write would leave
    writeFileSync(join(CACHE_DIR, 'orphan.ir.json.999.tmp'), '{', 'utf-8');

    expect(inspectCache().entries).toBe(1);
  });
});

describe('clearCache', () => {
  test('reports nothing when there is nothing to clear', () => {
    expect(clearCache().entries).toBe(0);
  });

  test('counts entries, not the files they are made of', () => {
    writeCacheFiles(inputKey('./a.json'), ir, {}, spec);
    writeCacheFiles(inputKey('./b.json'), ir, {}, spec);

    const summary = inspectCache();
    expect(summary.entries).toBe(2);
    expect(summary.bytes).toBeGreaterThan(0);
  });

  test('removes every entry, so the next run parses again', async () => {
    const input = seed();
    const text = JSON.stringify(spec);
    const specHash = new Bun.CryptoHasher('sha256').update(text).digest('hex');
    writeCacheFiles(inputKey(input), ir, { specHash }, spec);
    expect((await fetchWithCache(input)).hit).toBe(true);

    const cleared = clearCache();
    expect(cleared.entries).toBe(1);
    expect(inspectCache().entries).toBe(0);
    expect((await fetchWithCache(input)).hit).toBe(false);
  });
});

describe('cache.ttl', () => {
  const cached = (input: string) => {
    const text = JSON.stringify(spec);
    const specHash = new Bun.CryptoHasher('sha256').update(text).digest('hex');
    writeCacheFiles(inputKey(input), ir, { specHash }, spec);
    return specHash;
  };

  test('an entry is fresh while it is inside the window', async () => {
    const input = seed();
    cached(input);
    expect((await fetchWithCache(input, 60_000)).hit).toBe(true);
  });

  test('an entry past the window is a miss', async () => {
    const input = seed();
    cached(input);
    // written just now, so any window that has already elapsed excludes it
    expect((await fetchWithCache(input, -1)).hit).toBe(false);
  });

  test('no ttl means an entry never ages out', async () => {
    const input = seed();
    cached(input);
    expect((await fetchWithCache(input, null)).hit).toBe(true);
  });

  test('an entry from before timestamps were kept is not trusted forever', () => {
    expect(isExpired({ apigVersion: 'x' }, 60_000)).toBe(true);
    // with no ttl there is nothing to measure against, so it stays usable
    expect(isExpired({ apigVersion: 'x' }, null)).toBe(false);
  });

  test('sweeps entries nothing asks for any more', async () => {
    cached('./gone.json');
    cached('./also-gone.json');
    expect(inspectCache().entries).toBe(2);

    // the sweep runs on access, so a spec that is no longer generated still
    // gets cleaned up
    expect(purgeExpired(-1)).toBe(2);
    expect(inspectCache().entries).toBe(0);
  });

  test('sweeps nothing when entries never expire', () => {
    cached('./kept.json');
    expect(purgeExpired(null)).toBe(0);
    expect(inspectCache().entries).toBe(1);
  });
});

describe('getCacheSettings', () => {
  test('off when unset or false', () => {
    expect(getCacheSettings({} as never).enabled).toBe(false);
    expect(getCacheSettings({ cache: false } as never).enabled).toBe(false);
  });

  test('on with no expiry for the boolean form', () => {
    expect(getCacheSettings({ cache: true } as never)).toEqual({
      enabled: true,
      ttlMs: null,
      maxEntries: null,
    });
  });

  test('the object form turns it on by itself', () => {
    expect(getCacheSettings({ cache: { ttl: '7d' } } as never)).toEqual({
      enabled: true,
      ttlMs: 604_800_000,
      maxEntries: null,
    });
  });

  test('an object without a ttl is just an enabled cache', () => {
    expect(getCacheSettings({ cache: {} } as never)).toEqual({
      enabled: true,
      ttlMs: null,
      maxEntries: null,
    });
  });
});

describe('an unwritable cache', () => {
  const APIG_DIR = dirname(CACHE_DIR);

  test('reports the reason instead of throwing', () => {
    rmSync(APIG_DIR, { recursive: true, force: true });
    // a file where the directory should be: mkdir cannot proceed, whatever the
    // permissions or the user
    writeFileSync(APIG_DIR, 'not a directory', 'utf-8');

    const result = writeCacheFiles(inputKey('./x.json'), ir, {}, spec);

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toContain('ENOTDIR');

    rmSync(APIG_DIR, { force: true });
  });

  test('sweeping an unreadable cache is not an error', () => {
    rmSync(APIG_DIR, { recursive: true, force: true });
    writeFileSync(APIG_DIR, 'not a directory', 'utf-8');

    expect(purgeExpired(-1)).toBe(0);

    rmSync(APIG_DIR, { force: true });
  });

  test('inspecting one reports nothing rather than failing', () => {
    rmSync(APIG_DIR, { recursive: true, force: true });
    writeFileSync(APIG_DIR, 'not a directory', 'utf-8');

    expect(inspectCache().entries).toBe(0);

    rmSync(APIG_DIR, { force: true });
  });
});

describe('cache.maxEntries', () => {
  const cachedAt = (input: string, createdAt: string) => {
    const key = inputKey(input);
    writeCacheFiles(key, ir, {}, spec);
    // rewritten so the age is deterministic rather than "all within one ms"
    writeFileSync(
      join(CACHE_DIR, `${key}.meta.json`),
      JSON.stringify({ apigVersion: CURRENT_CACHE_VERSION, createdAt }),
      'utf-8',
    );
  };

  test('keeps everything while the count is within the limit', () => {
    cachedAt('./a.json', '2026-01-01T00:00:00.000Z');
    cachedAt('./b.json', '2026-01-02T00:00:00.000Z');

    expect(enforceMaxEntries(5)).toBe(0);
    expect(inspectCache().entries).toBe(2);
  });

  test('removes the oldest once the count goes over', () => {
    cachedAt('./old.json', '2026-01-01T00:00:00.000Z');
    cachedAt('./mid.json', '2026-01-02T00:00:00.000Z');
    cachedAt('./new.json', '2026-01-03T00:00:00.000Z');

    expect(enforceMaxEntries(1)).toBe(2);
    expect(inspectCache().entries).toBe(1);
    // the survivor is the newest
    expect(
      existsSync(join(CACHE_DIR, `${inputKey('./new.json')}.ir.json`)),
    ).toBe(true);
  });

  test('an entry with no timestamp goes first', () => {
    cachedAt('./dated.json', '2026-01-01T00:00:00.000Z');
    const key = inputKey('./undated.json');
    writeCacheFiles(key, ir, {}, spec);
    writeFileSync(
      join(CACHE_DIR, `${key}.meta.json`),
      JSON.stringify({ apigVersion: CURRENT_CACHE_VERSION }),
      'utf-8',
    );

    enforceMaxEntries(1);
    expect(existsSync(join(CACHE_DIR, `${key}.ir.json`))).toBe(false);
  });

  test('no limit removes nothing', () => {
    cachedAt('./a.json', '2026-01-01T00:00:00.000Z');
    cachedAt('./b.json', '2026-01-02T00:00:00.000Z');

    expect(enforceMaxEntries(null)).toBe(0);
    expect(inspectCache().entries).toBe(2);
  });
});
