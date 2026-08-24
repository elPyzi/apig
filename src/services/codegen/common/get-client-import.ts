import type { ApigConfig } from '@models';

export const getClientImport = (
  config: ApigConfig,
  resolvedPath?: string,
): { name: string; path: string } => {
  if (!config.httpClient || config.httpClient.name === 'fetch') {
    return { name: '', path: '' };
  }

  const { name, path, export: exportName } = config.httpClient;

  if (!path) throw new Error(`httpClient.path is required for ${name}`);
  if (!exportName) throw new Error(`httpClient.export is required for ${name}`);

  return { name: exportName, path: resolvedPath ?? path };
};
