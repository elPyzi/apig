import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { IR } from '@models';
import { inputKey, readMeta, readIR } from './storage';

const isUrl = (input: string): boolean =>
  input.startsWith('http://') || input.startsWith('https://');

export const fetchWithCache = async (
  input: string,
): Promise<{ hit: true; ir: IR } | { hit: false; text: string; etag?: string }> => {
  const key = inputKey(input);
  const meta = readMeta(key);

  if (isUrl(input)) {
    const headers: Record<string, string> = {};
    if (meta?.etag) headers['If-None-Match'] = meta.etag;

    const res = await fetch(input, { headers });

    if (res.status === 304) {
      const ir = readIR(key);
      if (ir) return { hit: true, ir };
    }

    const text = await res.text();
    const etag = res.headers.get('etag') ?? undefined;
    return { hit: false, text, etag };
  }

  const text = readFileSync(resolve(input), 'utf-8');
  const hash = createHash('sha256').update(text).digest('hex');
  if (meta?.specHash === hash) {
    const ir = readIR(key);
    if (ir) return { hit: true, ir };
  }
  return { hit: false, text, etag: undefined };
};
