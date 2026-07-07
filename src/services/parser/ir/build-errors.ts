import type { OpenAPIV3 } from 'openapi-types';
import type { IRErrorResponse } from '@models';
import { buildSchema, type SchemaObject } from './build-schema';

export const buildErrors = (
  operation: OpenAPIV3.OperationObject,
  schemaNames: Map<object, string>,
): IRErrorResponse[] => {
  const errors: IRErrorResponse[] = [];

  for (const [statusCode, responseObj] of Object.entries(
    operation.responses ?? {},
  )) {
    const code = Number(statusCode);
    if (code < 400) continue;

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
