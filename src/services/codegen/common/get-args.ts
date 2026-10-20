import type { IRProperty, IRSchema, IROperation } from '@models';
import { toPascalCase, quoteKey, toParamName } from '@libs/string';
import { generateTypeValue } from '@services/codegen/common/generate-type-value';

export type FnArg = {
  name: string;
  type: string;
  required: boolean;
};

/**
 * TypeScript type for a parameter value.
 *
 * Arrays matter here: the runtime `toQuery` helper has always serialized them,
 * but typing them as `string` made an array impossible to pass without a cast.
 */
const paramType = (
  param: IRProperty,
  allowArrays: boolean,
  allSchemas: IRSchema[],
): string => {
  const schema = param.schema;

  if (schema?.isEnum && schema.enum) {
    return schema.enum.map((v) => `'${v}'`).join(' | ');
  }

  if (allowArrays && schema?.type === 'array') {
    const item = schema.items ? scalarType(schema.items, allSchemas) : 'string';
    // a union item type needs Array<> so the `|` does not swallow the `[]`
    return item.includes('|') ? `Array<${item}>` : `${item}[]`;
  }

  return scalarType(schema, allSchemas, param.type);
};

const scalarType = (
  schema: IRSchema | undefined,
  allSchemas: IRSchema[],
  fallback?: string,
): string => {
  if (schema?.isEnum && schema.enum) {
    return schema.enum.map((v) => `'${v}'`).join(' | ');
  }

  const type = schema?.type ?? fallback;
  if (type === 'number') return 'number';
  if (type === 'boolean') return 'boolean';

  // A parameter is not always a scalar: a `deepObject` query parameter carries
  // a whole object, and calling that a string is simply wrong. Anything that is
  // not a primitive goes through the type generator, which resolves a `$ref` to
  // the declared name and inlines the rest.
  if (schema && type !== 'string') return generateTypeValue(schema, allSchemas);

  return 'string';
};

/** Declared schemas an operation's parameters resolve to, so callers can import them. */
export const getParamTypeNames = (
  operation: IROperation,
  allSchemas: IRSchema[],
): string[] => {
  const names = new Set<string>();
  const visit = (schema?: IRSchema): void => {
    if (!schema) return;
    if (schema.name && allSchemas.some((s) => s.name === schema.name)) {
      names.add(toPascalCase(schema.name));
      return;
    }
    schema.schemas?.forEach(visit);
    if (schema.items) visit(schema.items);
  };

  for (const group of [operation.params.query, operation.params.header]) {
    for (const param of group) visit(param.schema);
  }

  // an inline request body names the schemas it embeds, too
  if (operation.body?.contentType !== 'multipart')
    visit(operation.body?.schema);

  return [...names];
};

export const getArgs = (
  operation: IROperation,
  allSchemas: IRSchema[] = [],
): FnArg[] => {
  const args: FnArg[] = [];

  for (const param of operation.params.path) {
    args.push({
      name: toParamName(param.name),
      // a path segment is always a single value
      type: paramType(param, false, allSchemas),
      required: true,
    });
  }

  if (operation.params.query.length > 0) {
    // A query parameter name is not bound by JavaScript's identifier rules —
    // `employee-search-form-selection` and `2fa` are legal in a spec and a
    // syntax error as a bare key.
    const queryFields = operation.params.query
      .map((p) => {
        const optional = p.required ? '' : '?';
        return `${quoteKey(p.name)}${optional}: ${paramType(p, true, allSchemas)}`;
      })
      .join('; ');

    args.push({
      name: 'params',
      type: `{ ${queryFields} }`,
      required: operation.params.query.some((p) => p.required),
    });
  }

  if (operation.body) {
    if (operation.body.contentType === 'multipart') {
      const schema = operation.body.schema;
      if (schema.type === 'object' && schema.properties) {
        const sorted = [...schema.properties].sort(
          (a, b) => Number(b.required) - Number(a.required),
        );
        for (const prop of sorted) {
          const isBinary = prop.schema?.format === 'binary';
          args.push({
            name: prop.name,
            type: isBinary
              ? 'File | Blob'
              : prop.type === 'number'
                ? 'number'
                : 'string',
            required: prop.required,
          });
        }
      } else {
        // octet-stream or bare binary
        args.push({
          name: 'file',
          type: 'File | Blob',
          required: operation.body.required,
        });
      }
    } else {
      // `unknown` satisfies nothing: axios took it, but ky, ofetch and wretch all
      // reject it as a request body. The type generator resolves a declared
      // schema to its name and spells out an inline one.
      const bodyType = generateTypeValue(operation.body.schema, allSchemas);
      args.push({
        name: 'body',
        type: bodyType,
        required: operation.body.required,
      });
    }
  }

  if (operation.params.header.length > 0) {
    // header names routinely contain dashes, so every key is quoted
    const headerFields = operation.params.header
      .map((p) => {
        const optional = p.required ? '' : '?';
        return `'${p.name}'${optional}: ${paramType(p, false, allSchemas)}`;
      })
      .join('; ');

    args.push({
      name: 'headers',
      type: `{ ${headerFields} }`,
      required: operation.params.header.some((p) => p.required),
    });
  }

  return args;
};
