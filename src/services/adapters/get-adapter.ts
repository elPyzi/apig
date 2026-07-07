import { axiosAdapter } from '@services/adapters/axios';
import { kyAdapter } from '@services/adapters/ky';
import { ofetchAdapter } from '@services/adapters/ofetch';
import { wretchAdapter } from '@services/adapters/wretch';
import { fetchAdapter } from '@services/adapters/fetch';
import { type ApigConfig, HTTP_CLIENTS } from '@models';

export type Adapter = typeof axiosAdapter;

export const getAdapter = (config: ApigConfig): Adapter => {
  const name = config.httpClient?.name ?? HTTP_CLIENTS.FETCH;

  switch (name) {
    case HTTP_CLIENTS.AXIOS:
      return axiosAdapter;
    case HTTP_CLIENTS.KY:
      return kyAdapter;
    case HTTP_CLIENTS.OFETCH:
      return ofetchAdapter;
    case HTTP_CLIENTS.WRETCH:
      return wretchAdapter;
    default:
      return fetchAdapter;
  }
};
