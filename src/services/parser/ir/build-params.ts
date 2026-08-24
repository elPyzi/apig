import type { OpenAPIV3 } from 'openapi-types';
import {
  QUERY_STYLES,
  type IRParams,
  type IRProperty,
  type QueryStyle,
} from '@models';
import {
  buildSchema,
  normalizeType,
  typeMap,
  type SchemaObject,
} from './build-schema';

/**
 * Resolves the serialization style of a query parameter.
 * OpenAPI defaults query params to `form`, and `explode` to true for `form`
 * and false for every other style.
 */
const queryStyle = (
  param: OpenAPIV3.ParameterObject,
): { style: QueryStyle; explode: boolean } => {
  const style = (param.style as QueryStyle) ?? QUERY_STYLES.FORM;
  return {
    style,
    explode: param.explode ?? style === QUERY_STYLES.FORM,
  };
};

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
      type:
        typeMap[
          param.schema
            ? (normalizeType(param.schema as SchemaObject).type ?? '')
            : ''
        ] ?? 'unknown',
      schema: param.schema
        ? buildSchema(param.schema as SchemaObject, undefined, schemaNames, 1)
        : undefined,
    };

    if (param.in === 'path') params.path.push(irParam);
    if (param.in === 'query')
      params.query.push({ ...irParam, ...queryStyle(param) });
    if (param.in === 'header') params.header.push(irParam);
  }

  return params;
};
