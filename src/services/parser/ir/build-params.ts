import type { OpenAPIV3 } from 'openapi-types';
import type { IRParams, IRProperty } from '@models';
import { buildSchema, typeMap, type SchemaObject } from './build-schema';

export const buildParams = (
  pathItem: OpenAPIV3.PathItemObject,
  operation: OpenAPIV3.OperationObject,
  schemaNames: Map<object, string>,
): IRParams => {
  const allParams = [
    ...(pathItem.parameters ?? []),
    ...(operation.parameters ?? []),
  ] as OpenAPIV3.ParameterObject[];

  const params: IRParams = { path: [], query: [], header: [] };

  for (const param of allParams) {
    const irParam: IRProperty = {
      name: param.name,
      required: param.required ?? false,
      type: typeMap[(param.schema as SchemaObject)?.type ?? ''] ?? 'unknown',
      schema: param.schema
        ? buildSchema(param.schema as SchemaObject, undefined, schemaNames, 1)
        : undefined,
    };

    if (param.in === 'path') params.path.push(irParam);
    if (param.in === 'query') params.query.push(irParam);
    if (param.in === 'header') params.header.push(irParam);
  }

  return params;
};
