import type { OpenAPIV3 } from 'openapi-types';
import type { IRBody } from '@models';
import { buildSchema, type SchemaObject } from './build-schema';

export const buildBody = (
  operation: OpenAPIV3.OperationObject,
  schemaNames: Map<object, string>,
): IRBody | null => {
  const requestBody = operation.requestBody as
    OpenAPIV3.RequestBodyObject | undefined;
  if (!requestBody) return null;

  const jsonSchema = requestBody.content?.['application/json']?.schema;
  const multipartSchema =
    requestBody.content?.['multipart/form-data']?.schema ??
    requestBody.content?.['application/octet-stream']?.schema;

  if (jsonSchema) {
    return {
      required: requestBody.required ?? false,
      schema: buildSchema(
        jsonSchema as SchemaObject,
        undefined,
        schemaNames,
        1,
      ),
      contentType: 'json',
    };
  }

  if (multipartSchema) {
    return {
      required: requestBody.required ?? false,
      schema: buildSchema(
        multipartSchema as SchemaObject,
        undefined,
        schemaNames,
        1,
      ),
      contentType: 'multipart',
    };
  }

  return null;
};
