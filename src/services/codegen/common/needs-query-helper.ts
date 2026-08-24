import { HTTP_CLIENTS, type ApigConfig, type IR } from '@models';

/**
 * Whether the generated code needs the `toQuery` helper from config.ts.
 * Only plain fetch needs it — axios, ky, ofetch and wretch serialize query
 * params themselves from the `params` object.
 */
export const usesFetch = (config: ApigConfig): boolean =>
  (config.httpClient?.name ?? HTTP_CLIENTS.FETCH) === HTTP_CLIENTS.FETCH;

export const needsQueryHelper = (ir: IR, config: ApigConfig): boolean =>
  usesFetch(config) && ir.operations.some((op) => op.params.query.length > 0);

/**
 * The `parseErrorBody` helper is only used on the built-in fetch path — the
 * other clients surface the error body themselves.
 */
export const needsParseErrorHelper = (
  config: ApigConfig,
  errorHandlingEnabled: boolean,
): boolean => usesFetch(config) && errorHandlingEnabled;
