import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { IR } from '@models';
import type { OpenAPIV3 } from 'openapi-types';
import {
  inputKey,
  readMeta,
  readIR,
  readSpec,
  isExpired,
  purgeExpired,
  CURRENT_CACHE_VERSION,
} from './storage';

const isUrl = (input: string): boolean =>
  input.startsWith('http://') || input.startsWith('https://');

export type CacheResult =
  | { hit: true; ir: IR; spec: OpenAPIV3.Document }
  | { hit: false; text: string; etag?: string };

/**
 * The cached IR, or the spec text to parse instead.
 *
 * An entry counts as usable only when the IR, the spec and the writing apig all
 * line up: a half-present entry — a cleared `*.ir.json`, an interrupted write, a
 * partially restored CI cache — is treated as absent rather than trusted.
 */
const usableEntry = (
  key: string,
  meta: ReturnType<typeof readMeta>,
  ttlMs: number | null,
): { ir: IR; spec: OpenAPIV3.Document } | null => {
  if (meta?.apigVersion !== CURRENT_CACHE_VERSION) return null;
  if (isExpired(meta, ttlMs)) return null;
  const ir = readIR(key);
  const spec = readSpec(key);
  return ir && spec ? { ir, spec } : null;
};

export const fetchWithCache = async (
  input: string,
  ttlMs: number | null = null,
): Promise<CacheResult> => {
  // swept before reading, so entries for specs nobody generates any more are
  // cleaned up too rather than lingering until someone asks for them
  purgeExpired(ttlMs);

  const key = inputKey(input);
  const meta = readMeta(key);
  const entry = usableEntry(key, meta, ttlMs);

  if (isUrl(input)) {
    const headers: Record<string, string> = {};
    // asking for a 304 only makes sense when there is something to fall back on;
    // a 304 body is empty, and parsing that used to fail with an error naming
    // neither the cache nor the reason
    if (meta?.etag && entry) headers['If-None-Match'] = meta.etag;

    const res = await fetch(input, { headers });
    if (res.status === 304 && entry) return { hit: true, ...entry };

    const text = await res.text();
    const etag = res.headers.get('etag') ?? undefined;
    return { hit: false, text, etag };
  }

  const text = readFileSync(resolve(input), 'utf-8');
  const hash = createHash('sha256').update(text).digest('hex');
  if (meta?.specHash === hash && entry) return { hit: true, ...entry };

  return { hit: false, text, etag: undefined };
};
