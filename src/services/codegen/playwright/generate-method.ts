import {
  toHttpMethodLower,
  type ApigConfig,
  type IROperation,
  type IRSchema,
} from '@models';
import { buildArgsList } from '@services/codegen/common/build-args';
import { buildJsDoc } from '@services/codegen/common/jsdoc';
import { getResponseType } from '@services/codegen/common/get-response-type';
import { getUrl } from '@services/codegen/common/get-url';
import {
  PARSE_API_ERROR_FN,
  TO_HEADERS_FN,
  TO_MULTIPART_FN,
  TO_PARAMS_FN,
} from './helpers';
import { getMethodName, getPlaywrightArgs, indent } from './utils';

export interface PlaywrightMethodOptions {
  /** Error class thrown on a non-2xx response, or `null` to pass every response through. */
  errorClass: string | null;
  /** Hand back Playwright's `APIResponse` instead of the parsed body. */
  rawResponse: boolean;
}

/** Field names posted through Playwright's `multipart` option. */
const buildMultipartFields = (operation: IROperation): string[] => {
  const schema = operation.body?.schema;

  if (schema?.type === 'object' && schema.properties) {
    return [...schema.properties]
      .sort((a, b) => Number(b.required) - Number(a.required))
      .map((prop) => prop.name);
  }

  // octet-stream or bare binary — `getArgs` names the single argument `file`
  return ['file'];
};

/** Request options passed to the Playwright call, in `ctx.post(url, { … })`. */
const buildRequestOptions = (operation: IROperation): string => {
  const parts: string[] = [];

  if (operation.params.query.length > 0) {
    parts.push(`params: ${TO_PARAMS_FN}(params)`);
  }

  if (operation.body) {
    parts.push(
      operation.body.contentType === 'multipart'
        ? `multipart: ${TO_MULTIPART_FN}({ ${buildMultipartFields(operation).join(', ')} })`
        : 'data: body',
    );
  }

  if (operation.params.header.length > 0) {
    parts.push(`headers: ${TO_HEADERS_FN}(headers)`);
  }

  return parts.length > 0 ? `, { ${parts.join(', ')} }` : '';
};

/**
 * One method of the generated client, rendered as a property of the object the
 * factory returns.
 *
 * `ctx` is the factory's `APIRequestContext` parameter, so the same method works
 * against the standalone `request` fixture and against `page.request`.
 */
export const generatePlaywrightMethod = (
  operation: IROperation,
  allSchemas: IRSchema[],
  baseUrl: string,
  config: ApigConfig,
  opts: PlaywrightMethodOptions,
): string => {
  const name = getMethodName(operation, config);
  const method = toHttpMethodLower(operation.method);
  const url = getUrl(operation.path, baseUrl);
  const responseType = getResponseType(operation.response, allSchemas);
  const args = getPlaywrightArgs(operation);
  const argsList = buildArgsList(args);
  const call = `ctx.${method}(${url}${buildRequestOptions(operation)})`;

  const doc = buildJsDoc({
    description: operation.summary ?? operation.description,
    deprecated: operation.deprecated,
    params: args.map((arg) => ({ name: arg.name })),
  });
  const jsDoc = doc ? indent(doc) : '';

  // The response object itself is what a test asserts on — status, headers and
  // body all stay reachable, so nothing is thrown and nothing is parsed here.
  if (opts.rawResponse) {
    return `${jsDoc}  ${name}: (${argsList}): Promise<APIResponse> =>\n    ${call},`;
  }

  const returnsBody = responseType !== 'void';
  const lines: string[] = [
    `${jsDoc}  ${name}: async (${argsList}): Promise<${responseType}> => {`,
  ];

  // Binding the response would leave an unused variable in the generated file
  // when there is neither a status to check nor a body to return.
  if (!opts.errorClass && !returnsBody) {
    lines.push(`    await ${call};`, '  },');
    return lines.join('\n');
  }

  lines.push(`    const r = await ${call};`);

  if (opts.errorClass) {
    lines.push(
      `    if (!r.ok()) throw new ${opts.errorClass}(r.status(), await ${PARSE_API_ERROR_FN}(r));`,
    );
  }

  if (returnsBody) {
    lines.push(`    return r.json() as Promise<${responseType}>;`);
  }

  lines.push('  },');

  return lines.join('\n');
};
