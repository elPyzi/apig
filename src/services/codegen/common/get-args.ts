import type { IRProperty, IRSchema, IROperation } from '@models';
import { toPascalCase } from '@libs/string';

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
const paramType = (param: IRProperty, allowArrays: boolean): string => {
  const schema = param.schema;

  if (schema?.isEnum && schema.enum) {
    return schema.enum.map((v) => `'${v}'`).join(' | ');
  }

  if (allowArrays && schema?.type === 'array') {
    const item = schema.items ? scalarType(schema.items) : 'string';
    // a union item type needs Array<> so the `|` does not swallow the `[]`
    return item.includes('|') ? `Array<${item}>` : `${item}[]`;
  }

  return scalarType(schema, param.type);
};

const scalarType = (schema?: IRSchema, fallback?: string): string => {
  if (schema?.isEnum && schema.enum) {
    return schema.enum.map((v) => `'${v}'`).join(' | ');
  }

  const type = schema?.type ?? fallback;
  if (type === 'number') return 'number';
  if (type === 'boolean') return 'boolean';
  return 'string';
};

export const getArgs = (operation: IROperation): FnArg[] => {
  const args: FnArg[] = [];

  for (const param of operation.params.path) {
    args.push({
      name: param.name,
      // a path segment is always a single value
      type: paramType(param, false),
      required: true,
    });
  }

  if (operation.params.query.length > 0) {
    const queryFields = operation.params.query
      .map((p) => {
        const optional = p.required ? '' : '?';
        return `${p.name}${optional}: ${paramType(p, true)}`;
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
      const bodyType = operation.body.schema.name
        ? toPascalCase(operation.body.schema.name)
        : 'unknown';
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
        return `'${p.name}'${optional}: ${paramType(p, false)}`;
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
