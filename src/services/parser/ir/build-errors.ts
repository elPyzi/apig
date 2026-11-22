import type { OpenAPIV3 } from 'openapi-types';
import type { IRErrorResponse } from '@models';
import { buildSchema, type SchemaObject } from './build-schema';

/**
 * The status an error response is keyed by, `null` for one that stands for many
 * — `default` (anything not listed) or a range like `4XX` — and `undefined` for
 * a key that is not an error at all. `Number('default')` is `NaN`, which slipped
 * past the `< 400` check and into the generated type.
 */
const errorStatus = (key: string): number | null | undefined => {
  if (key === 'default') return null;
  if (/^[45]XX$/i.test(key)) return null;
  if (!/^\d{3}$/.test(key)) return undefined;
  const code = Number(key);
  return code >= 400 ? code : undefined;
};

export const buildErrors = (
  operation: OpenAPIV3.OperationObject,
  schemaNames: Map<object, string>,
): IRErrorResponse[] => {
  const errors: IRErrorResponse[] = [];

  for (const [statusCode, responseObj] of Object.entries(
    operation.responses ?? {},
  )) {
    const code = errorStatus(statusCode);
    if (code === undefined) continue;

    const resp = responseObj as OpenAPIV3.ResponseObject;
    const jsonSchema = resp.content?.['application/json']?.schema;
    if (jsonSchema) {
      errors.push({
        status: code,
        schema: buildSchema(
          jsonSchema as SchemaObject,
          undefined,
          schemaNames,
          1,
        ),
      });
    }
  }

  return errors;
};
