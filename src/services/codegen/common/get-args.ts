import type { IROperation } from '@models';
import { toPascalCase } from '@libs/string';

export type FnArg = {
  name: string;
  type: string;
  required: boolean;
};

export const getArgs = (operation: IROperation): FnArg[] => {
  const args: FnArg[] = [];

  for (const param of operation.params.path) {
    args.push({
      name: param.name,
      type: param.type === 'number' ? 'number' : 'string',
      required: true,
    });
  }

  if (operation.params.query.length > 0) {
    const queryFields = operation.params.query
      .map((p) => {
        const optional = p.required ? '' : '?';
        let type: string;
        if (p.schema?.isEnum && p.schema.enum) {
          type = p.schema.enum.map((v) => `'${v}'`).join(' | ');
        } else {
          type = p.type === 'number' ? 'number' : 'string';
        }
        return `${p.name}${optional}: ${type}`;
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

  return args;
};
