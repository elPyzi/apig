import type { OpenAPIV3 } from 'openapi-types';

export const schemaNames = new Map<object, string>();

export const makeOperation = (
  overrides: Partial<OpenAPIV3.OperationObject> = {},
): OpenAPIV3.OperationObject => ({
  responses: {},
  ...overrides,
});

export const makeSpec = (
  paths: OpenAPIV3.PathsObject = {},
  schemas: Record<string, OpenAPIV3.SchemaObject> = {},
): OpenAPIV3.Document => ({
  openapi: '3.0.0',
  info: { title: 'Test', version: '1.0.0' },
  paths,
  components: { schemas },
});

export const jsonResponse = (
  schema: OpenAPIV3.SchemaObject,
): OpenAPIV3.ResponseObject => ({
  description: 'OK',
  content: { 'application/json': { schema } },
});
