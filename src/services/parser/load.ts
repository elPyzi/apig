import { createHash } from 'crypto';
import type { IR } from '@models';
import type { ApigConfig } from '@models';
import type { OpenAPIV3 } from 'openapi-types';
import { logger } from '@libs/logger';
import { loadSpec } from './swagger';
import { buildIR } from './ir';
import {
  fetchWithCache,
  saveCache,
  getCacheSettings,
  enforceMaxEntries,
} from '@services/cache';

export interface LoadResult {
  ir: IR;
  spec: OpenAPIV3.Document;
}

export const load = async (config: ApigConfig): Promise<LoadResult> => {
  logger.stage('Specification loading...');

  const input =
    typeof config.input === 'function' ? await config.input() : config.input;

  const cache = getCacheSettings(config);

  if (cache.enabled) {
    const result = await fetchWithCache(input, cache.ttlMs);

    if (result.hit) {
      logger.success('IR restored from cache');
      logger.br();
      return { ir: result.ir, spec: result.spec };
    }

    // Parsed exactly the way an uncached run parses, so turning the cache on
    // cannot change the outcome. Handing the parser the fetched text instead
    // loses the base location, and a relative `$ref` to a neighbouring file then
    // resolves to nothing — enabling the cache failed the whole run.
    const { spec, schemaNames } = await loadSpec(config);
    logger.stage('Specification loaded');
    logger.stage('Building IR...');
    const ir = buildIR(spec, schemaNames);
    logger.stage('IR built');

    const specHash = createHash('sha256').update(result.text).digest('hex');
    const saved = saveCache(input, ir, result.etag, specHash, spec);
    if (saved.ok) {
      // enforced after writing, since that is the only moment the count grows
      enforceMaxEntries(cache.maxEntries);
      logger.detail('IR cached');
    } else {
      // the run carries on uncached rather than failing over an optimization
      logger.warn(`Could not write the cache — ${saved.reason}`);
    }

    return { ir, spec };
  }

  const { spec, schemaNames } = await loadSpec(config);
  logger.stage('Specification loaded');
  logger.stage('Building IR...');
  const ir = buildIR(spec, schemaNames);
  logger.stage('IR built');
  return { ir, spec };
};
