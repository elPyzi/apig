import type { OpenAPIV3 } from 'openapi-types';
import type { IRSchema } from '@models';
import { buildSchema, type SchemaObject } from './build-schema';

export const buildResponse = (
  operation: OpenAPIV3.OperationObject,
  schemaNames: Map<object, string>,
): IRSchema | null => {
  const successResponse = (operation.responses?.['200'] ??
    operation.responses?.['201']) as OpenAPIV3.ResponseObject | undefined;

  const jsonSchema = successResponse?.content?.['application/json']?.schema;
  if (!jsonSchema) return null;

  return buildSchema(jsonSchema as SchemaObject, undefined, schemaNames, 1);
};
