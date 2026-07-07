import type { ApigConfig } from '@models';
import { logger } from '@libs/logger';

let warned = false;

export const resetBaseUrlWarning = (): void => {
  warned = false;
};

export const getBaseUrl = (config: ApigConfig): string => {
  if (config.baseUrl) return config.baseUrl;

  const isFetch = !config.httpClient || config.httpClient.name === 'fetch';

  if (isFetch && !warned) {
    warned = true;
    logger.warn('baseUrl is not set — fetch will use relative paths');
    logger.warn('set baseUrl in config: baseUrl: "https://api.example.com"');
  }

  return '';
};
