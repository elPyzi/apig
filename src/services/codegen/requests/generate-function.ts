import { getAdapter, NO_BODY } from '@services/adapters';
import {
  HTTP_CLIENTS,
  toHttpMethodLower,
  type ApigConfig,
  type IROperation,
  type IRSchema,
} from '@models';
import { getArgs } from '@services/codegen/common/get-args';
import { buildArgsList } from '@services/codegen/common/build-args';
import {
  buildQueryFormats,
  hasCustomQueryFormat,
} from '@services/codegen/common/query-formats';
import { logger } from '@libs/logger';
import { getResponseType } from '@services/codegen/common/get-response-type';
import { getUrl } from '@services/codegen/common/get-url';
import { buildJsDoc } from '@services/codegen/common/jsdoc';
import { getErrorConfig } from '@services/codegen/common/get-error-config';
import { buildErrorHandlingBody } from './build-error-handling';
import { buildRawResponseBody } from './build-raw-response';
import { buildMultipartBody } from './build-multipart';
import { returnLines } from './return-lines';
import { getFunctionName } from '@services/codegen/common/get-function-name';

export const generateFunction = (
  operation: IROperation,
  allSchemas: IRSchema[],
  clientName: string,
  baseUrl: string,
  config: ApigConfig,
): string => {
  const fnName = getFunctionName(operation, config);
  const method = toHttpMethodLower(operation.method);
  const url = getUrl(operation.path, baseUrl);
  const responseType = getResponseType(operation.response, allSchemas);
  const args = getArgs(operation, allSchemas);
  const adapter = getAdapter(config);
  const isMultipart = operation.body?.contentType === 'multipart';
  const httpClient = config.httpClient?.name ?? HTTP_CLIENTS.FETCH;
  const errCfg = getErrorConfig(config);
  const errorHandling = errCfg.enabled;
  const errorClass = errCfg.className;
  const rawResponse = config.rawResponse === true;
  const logAs = config.apiLogging ? fnName : undefined;

  const hasQuery = operation.params.query.length > 0;
  const hasBody = operation.body !== null;
  const hasHeaders = operation.params.header.length > 0;
  const queryFormats = buildQueryFormats(operation.params.query);

  // Only the built-in fetch path builds the query string itself; the other
  // clients own that step, so a non-default style would be silently ignored.
  if (
    queryFormats &&
    httpClient !== HTTP_CLIENTS.FETCH &&
    httpClient !== HTTP_CLIENTS.KY &&
    hasCustomQueryFormat(operation.params.query)
  ) {
    logger.warn(
      `${operation.id}: query style/explode is not applied with httpClient "${httpClient}" — configure serialization on the client instance`,
    );
  }

  const argsList = buildArgsList(args);

  const returnType = rawResponse
    ? `ApigResponse<${responseType}>`
    : responseType;

  const doc = buildJsDoc({
    description: operation.summary ?? operation.description,
    deprecated: operation.deprecated,
    params: args.map((a) => ({ name: a.name })),
  });

  if (isMultipart) {
    const fdSetup = buildMultipartBody(operation);
    const queryArgs = queryFormats ? `params, ${queryFormats}` : 'params';
    const urlExpr = hasQuery
      ? url.slice(0, -1) + '${toQuery(' + queryArgs + ')}`'
      : url;
    // no Content-Type here on purpose — the runtime sets it with the multipart boundary
    const fetchCall = `fetch(${urlExpr}, { method: '${method.toUpperCase()}', body: _fd${hasHeaders ? ', headers' : ''} })`;

    const open = `${doc}export const ${fnName} = async (${argsList}): Promise<${returnType}> => {`;
    // the fetch path of the other branches, so a multipart request checks its
    // status, wraps a raw response and logs exactly as a JSON one does
    if (rawResponse || errorHandling) {
      const body = rawResponse
        ? buildRawResponseBody(
            fetchCall,
            responseType,
            HTTP_CLIENTS.FETCH,
            errorHandling,
            errorClass,
            logAs,
          )
        : buildErrorHandlingBody(
            fetchCall,
            responseType,
            HTTP_CLIENTS.FETCH,
            errorClass,
            logAs,
          );
      return [open, fdSetup, body, `};`].join('\n');
    }
    if (responseType === NO_BODY) {
      return [
        open,
        fdSetup,
        `  await ${fetchCall};`,
        ...(logAs ? [`  console.log('${logAs}');`] : []),
        `};`,
      ].join('\n');
    }
    return [
      open,
      fdSetup,
      `  const r = await ${fetchCall};`,
      ...returnLines(`(await r.json()) as ${responseType}`, '  ', logAs),
      `};`,
    ].join('\n');
  }

  const call = adapter(method, {
    url,
    type: responseType,
    client: clientName,
    hasQuery,
    hasBody,
    hasHeaders,
    queryFormats,
  });

  if (rawResponse || errorHandling) {
    const body = rawResponse
      ? buildRawResponseBody(
          call,
          responseType,
          httpClient,
          errorHandling,
          errorClass,
          logAs,
        )
      : buildErrorHandlingBody(
          call,
          responseType,
          httpClient,
          errorClass,
          logAs,
        );
    return [
      `${doc}export const ${fnName} = async (${argsList}): Promise<${returnType}> => {`,
      body,
      `};`,
    ].join('\n');
  }

  // the other paths unwrap `r.data` themselves; here the call is returned as is
  const dataCall =
    httpClient === HTTP_CLIENTS.AXIOS ? `${call}.then(r => r.data)` : call;

  if (config.apiLogging) {
    return [
      `${doc}export const ${fnName} = async (${argsList}): Promise<${returnType}> => {`,
      `  const response = await ${dataCall};`,
      `  console.log('${fnName}', response);`,
      `  return response;`,
      `};`,
    ].join('\n');
  }

  return `${doc}export const ${fnName} = (${argsList}): Promise<${returnType}> =>\n  ${dataCall};`;
};
