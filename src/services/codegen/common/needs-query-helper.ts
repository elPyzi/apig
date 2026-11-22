import { HTTP_CLIENTS, type ZvyappyConfig, type IR } from '@models';

/**
 * Whether the generated code needs the `toQuery` helper from config.ts.
 * Only plain fetch needs it — axios, ky, ofetch and wretch serialize query
 * params themselves from the `params` object.
 */
export const usesFetch = (config: ZvyappyConfig): boolean =>
  (config.httpClient?.name ?? HTTP_CLIENTS.FETCH) === HTTP_CLIENTS.FETCH;

/** Clients that hand query serialization to zvyappy rather than doing it themselves. */
const serializesQueryItself = (config: ZvyappyConfig): boolean => {
  const client = config.httpClient?.name ?? HTTP_CLIENTS.FETCH;
  return client === HTTP_CLIENTS.FETCH || client === HTTP_CLIENTS.KY;
};

/** A multipart body always goes out through the built-in fetch, whatever the client. */
const isMultipart = (op: IR['operations'][number]): boolean =>
  op.body?.contentType === 'multipart';

export const needsQueryHelper = (ir: IR, config: ZvyappyConfig): boolean =>
  ir.operations.some(
    (op) =>
      op.params.query.length > 0 &&
      (serializesQueryItself(config) || isMultipart(op)),
  );

/**
 * The `parseErrorBody` helper is used on the built-in fetch path — the other
 * clients surface the error body themselves, except for a multipart request,
 * which is sent through fetch for every client.
 */
export const needsParseErrorHelper = (
  ir: IR,
  config: ZvyappyConfig,
  errorHandlingEnabled: boolean,
): boolean =>
  errorHandlingEnabled &&
  (usesFetch(config) || ir.operations.some(isMultipart));
