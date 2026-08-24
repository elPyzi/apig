import { type ApigConfig, HTTP_CLIENTS } from '@models';
import { getAdapterByName, type Adapter } from '@services/adapters/adapters';

export const getAdapter = (config: ApigConfig): Adapter =>
  getAdapterByName(config.httpClient?.name ?? HTTP_CLIENTS.FETCH);
