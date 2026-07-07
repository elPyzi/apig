import type { IR } from '@models';
import { inputKey, writeCacheFiles } from './storage';

export { fetchWithCache } from './fetch';

export const saveCache = (input: string, ir: IR, etag?: string, specHash?: string): void => {
  const key = inputKey(input);
  writeCacheFiles(key, ir, { etag, specHash });
};
