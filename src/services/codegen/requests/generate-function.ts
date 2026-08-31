import { getAdapter } from '@services/adapters';
import {
  NAMING_CASES,
  HTTP_CLIENTS,
  toHttpMethodLower,
  type ApigConfig,
  type IROperation,
  type IRSchema,
} from '@models';
import { CaseFns } from '@libs/string';
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

export const generateFunction = (
  operation: IROperation,
  allSchemas: IRSchema[],
  clientName: string,
  baseUrl: string,
  config: ApigConfig,
): string => {
  const fnName = CaseFns[config?.functionNaming ?? NAMING_CASES.CAMEL](
    operation.id,
  );
  const method = toHttpMethodLower(operation.method);
  const url = getUrl(operation.path, baseUrl);
  const responseType = getResponseType(operation.response, allSchemas);
  const args = getArgs(operation);
  const adapter = getAdapter(config);
  const isMultipart = operation.body?.contentType === 'multipart';
  const httpClient = config.httpClient?.name ?? HTTP_CLIENTS.FETCH;
  const errCfg = getErrorConfig(config);
  const errorHandling = errCfg.enabled;
  const errorClass = errCfg.className;
  const rawResponse = config.rawResponse === true;

  const hasQuery = operation.params.query.length > 0;
  const hasBody = operation.body !== null;
  const hasHeaders = operation.params.header.length > 0;
  const queryFormats = buildQueryFormats(operation.params.query);

  // Only the built-in fetch path builds the query string itself; the other
  // clients own that step, so a non-default style would be silently ignored.
  if (
    queryFormats &&
    httpClient !== HTTP_CLIENTS.FETCH &&
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
    const fetchCall = `fetch(${urlExpr}, { method: '${method.toUpperCase()}', body: _fd${hasHeaders ? ', headers' : ''} }).then(r => r.json() as Promise<${responseType}>)`;

    if (config.apiLogging) {
      return [
        `${doc}export const ${fnName} = async (${argsList}): Promise<${returnType}> => {`,
        fdSetup,
        `  const response = await ${fetchCall};`,
        `  console.log('${fnName}', response);`,
        `  return response;`,
        `};`,
      ].join('\n');
    }
    return [
      `${doc}export const ${fnName} = async (${argsList}): Promise<${returnType}> => {`,
      fdSetup,
      `  return ${fetchCall};`,
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

  if (rawResponse) {
    const logging = config.apiLogging === true;
    const body = buildRawResponseBody(
      call,
      responseType,
      httpClient,
      errorHandling,
      errorClass,
      logging,
    );
    if (logging) {
      return [
        `${doc}export const ${fnName} = async (${argsList}): Promise<${returnType}> => {`,
        body,
        `  console.log('${fnName}', response);`,
        `  return response;`,
        `};`,
      ].join('\n');
    }
    return [
      `${doc}export const ${fnName} = async (${argsList}): Promise<${returnType}> => {`,
      body,
      `};`,
    ].join('\n');
  }

  if (errorHandling) {
    const body = buildErrorHandlingBody(
      call,
      responseType,
      httpClient,
      errorClass,
    );
    if (config.apiLogging) {
      return [
        `${doc}export const ${fnName} = async (${argsList}): Promise<${returnType}> => {`,
        body,
        `  console.log('${fnName}', response);`,
        `};`,
      ].join('\n');
    }
    return [
      `${doc}export const ${fnName} = async (${argsList}): Promise<${returnType}> => {`,
      body,
      `};`,
    ].join('\n');
  }

  if (config.apiLogging) {
    return [
      `${doc}export const ${fnName} = async (${argsList}): Promise<${returnType}> => {`,
      `  const response = await ${call};`,
      `  console.log('${fnName}', response);`,
      `  return response;`,
      `};`,
    ].join('\n');
  }

  return `${doc}export const ${fnName} = (${argsList}): Promise<${returnType}> =>\n  ${call};`;
};
