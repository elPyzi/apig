import { createHash } from 'crypto';
import type { IR } from '@models';
import type { ApigConfig } from '@models';
import type { OpenAPIV3 } from 'openapi-types';
import { logger } from '@libs/logger';
import { loadSpec } from './swagger';
import { loadSpecFromText } from './swagger/load-spec';
import { buildIR } from './ir';
import { fetchWithCache, saveCache } from '@services/cache';

export interface LoadResult {
  ir: IR;
  spec: OpenAPIV3.Document;
}

export const load = async (config: ApigConfig): Promise<LoadResult> => {
  logger.stage('Specification loading...');

  const input = typeof config.input === 'function' ? await config.input() : config.input;

  if (config.cache) {
    const result = await fetchWithCache(input);

    if (result.hit) {
      logger.success('IR restored from cache');
      logger.br();
      return { ir: result.ir, spec: {} as OpenAPIV3.Document };
    }

    // Cache miss — parse from fetched text
    const { spec, schemaNames } = await loadSpecFromText(result.text, config);
    logger.stage('Specification loaded');
    logger.stage('Building IR...');
    const ir = buildIR(spec, schemaNames);
    logger.stage('IR built');

    const specHash = createHash('sha256').update(result.text).digest('hex');
    saveCache(input, ir, result.etag, specHash);
    logger.detail('IR cached');

    return { ir, spec };
  }

  const { spec, schemaNames } = await loadSpec(config);
  logger.stage('Specification loaded');
  logger.stage('Building IR...');
  const ir = buildIR(spec, schemaNames);
  logger.stage('IR built');
  return { ir, spec };
};
