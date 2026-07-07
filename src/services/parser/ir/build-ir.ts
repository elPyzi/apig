import type { OpenAPIV3 } from 'openapi-types';
import type { IR, IRSchema, HttpMethod } from '@models';
import { HTTP_METHODS, toHttpMethodLower } from '@models';
import { buildSchema, type SchemaObject } from './build-schema';
import { buildParams } from './build-params';
import { buildBody } from './build-body';
import { buildResponse } from './build-response';
import { buildErrors } from './build-errors';

export const buildIR = (
  spec: OpenAPIV3.Document,
  schemaNames: Map<object, string>,
): IR => {
  const schemas: IRSchema[] = Object.entries(
    spec.components?.schemas ?? {},
  ).map(([name, schema]) =>
    buildSchema(schema as SchemaObject, name, schemaNames),
  );

  const methods = Object.values(HTTP_METHODS).map(toHttpMethodLower);
  const operations = [];

  for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
    if (!pathItem) continue;

    for (const method of methods) {
      const operation = pathItem[method];
      if (!operation) continue;

      const errors = buildErrors(operation, schemaNames);

      operations.push({
        id: operation.operationId ?? `${method}_${path.replace(/\W+/g, '_')}`,
        method: method.toUpperCase() as HttpMethod,
        path,
        tag: operation.tags?.[0] ?? 'default',
        deprecated: operation.deprecated ?? false,
        params: buildParams(pathItem, operation, schemaNames),
        body: buildBody(operation, schemaNames),
        response: buildResponse(operation, schemaNames),
        errors: errors.length > 0 ? errors : undefined,
        summary: operation.summary,
        description: operation.description,
      });
    }
  }

  return { operations, schemas };
};
