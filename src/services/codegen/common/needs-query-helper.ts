import { HTTP_CLIENTS, type ApigConfig, type IR } from '@models';

/**
 * Whether the generated code needs the `toQuery` helper from config.ts.
 * Only plain fetch needs it — axios, ky, ofetch and wretch serialize query
 * params themselves from the `params` object.
 */
export const usesFetch = (config: ApigConfig): boolean =>
  (config.httpClient?.name ?? HTTP_CLIENTS.FETCH) === HTTP_CLIENTS.FETCH;

/** Clients that hand query serialization to apig rather than doing it themselves. */
const serializesQueryItself = (config: ApigConfig): boolean => {
  const client = config.httpClient?.name ?? HTTP_CLIENTS.FETCH;
  return client === HTTP_CLIENTS.FETCH || client === HTTP_CLIENTS.KY;
};

export const needsQueryHelper = (ir: IR, config: ApigConfig): boolean =>
  serializesQueryItself(config) &&
  ir.operations.some((op) => op.params.query.length > 0);

/**
 * The `parseErrorBody` helper is only used on the built-in fetch path — the
 * other clients surface the error body themselves.
 */
export const needsParseErrorHelper = (
  config: ApigConfig,
  errorHandlingEnabled: boolean,
): boolean => usesFetch(config) && errorHandlingEnabled;
