import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import type { IR } from '@models';

const CACHE_DIR = resolve('.apig/cache');

export interface CacheMeta {
  etag?: string;
  specHash?: string;
}

export const inputKey = (input: string): string =>
  createHash('sha256').update(input).digest('hex').slice(0, 16);

const metaPath = (key: string) => join(CACHE_DIR, `${key}.meta.json`);
const irPath = (key: string) => join(CACHE_DIR, `${key}.ir.json`);

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

export const writeCacheFiles = (key: string, ir: IR, meta: CacheMeta): void => {
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(irPath(key), JSON.stringify(ir), 'utf-8');
  writeFileSync(metaPath(key), JSON.stringify(meta), 'utf-8');
};
