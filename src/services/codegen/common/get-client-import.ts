import type { ApigConfig } from '@models';
import { logger } from '@libs/logger';

export const getClientImport = (
  config: ApigConfig,
  resolvedPath?: string,
): { name: string; path: string } => {
  if (!config.httpClient || config.httpClient.name === 'fetch') {
    return { name: '', path: '' };
  }

  const { name, path, export: exportName } = config.httpClient;

  if (!path) {
    logger.error(`httpClient.path is required for ${name}`);
    throw new Error(`httpClient.path is required for ${name}`);
  }

  if (!exportName) {
    logger.error(`httpClient.export is required for ${name}`);
    throw new Error(`httpClient.export is required for ${name}`);
  }

  return { name: exportName, path: resolvedPath ?? path };
};
