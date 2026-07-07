import { getAdapter } from '@services/adapters';
import {
  NAMING_CASES,
  HTTP_CLIENTS,
  HTTP_METHODS,
  toHttpMethodLower,
  type ApigConfig,
  type IROperation,
} from '@models';
import { CaseFns } from '@libs/string';
import { getArgs } from '@services/codegen/common/get-args';
import { getResponseType } from '@services/codegen/common/get-response-type';
import { getUrl } from '@services/codegen/common/get-url';
import { buildJsDoc } from '@services/codegen/common/jsdoc';
import { getErrorConfig } from '@services/codegen/common/get-error-config';
import { buildErrorHandlingBody } from './build-error-handling';
import { buildRawResponseBody } from './build-raw-response';
import { buildMultipartBody } from './build-multipart';

export const generateFunction = (
  operation: IROperation,
  clientName: string,
  baseUrl: string,
  config: ApigConfig,
): string => {
  const fnName = CaseFns[config?.functionNaming ?? NAMING_CASES.CAMEL](operation.id);
  const method = toHttpMethodLower(operation.method);
  const url = getUrl(operation.path, baseUrl);
  const responseType = getResponseType(operation.response);
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

  const argsList = args
    .map((a) => `${a.name}${a.required ? '' : '?'}: ${a.type}`)
    .join(', ');

  const returnType = rawResponse ? `ApigResponse<${responseType}>` : responseType;

  const doc = buildJsDoc({
    description: operation.summary ?? operation.description,
    deprecated: operation.deprecated,
    params: args.map((a) => ({ name: a.name })),
  });

  if (isMultipart) {
    const fdSetup = buildMultipartBody(operation);
    const urlExpr = hasQuery
      ? url.slice(0, -1) + '?${new URLSearchParams(params)}`'
      : url;
    const fetchCall = `fetch(${urlExpr}, { method: '${method.toUpperCase()}', body: _fd }).then(r => r.json() as Promise<${responseType}>)`;

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

  let call = '';
  if (method === 'get' || method === 'delete') {
    call = adapter[method](url, responseType, clientName, hasQuery);
  } else {
    call = adapter[method](url, responseType, clientName, hasQuery, hasBody);
  }

  if (rawResponse) {
    const logging = config.apiLogging === true;
    const body = buildRawResponseBody(call, responseType, httpClient, errorHandling, errorClass, logging);
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
    const body = buildErrorHandlingBody(call, responseType, httpClient, errorClass);
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
