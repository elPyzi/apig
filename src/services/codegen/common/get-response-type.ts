import type { IRSchema } from '@models';
import { toPascalCase } from '@libs/string';

export const getResponseType = (schema: IRSchema | null): string => {
  if (!schema) return 'void';

  if (schema.name) return toPascalCase(schema.name);

  if (schema.type === 'array' && schema.items) {
    const itemType = schema.items.name
      ? toPascalCase(schema.items.name)
      : schema.items.type;
    return `Array<${itemType}>`;
  }

  switch (schema.type) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    default:
      return 'unknown';
  }
};
