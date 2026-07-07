import type { IRSchema } from '@models';
import { toPascalCase } from '@libs/string';
import { generateProperty } from '@services/codegen/common/generate-property';

export const generateTypeValue = (schema: IRSchema): string => {
  if (schema.type === 'allOf' && schema.schemas) {
    return schema.schemas.map(generateTypeValue).join(' & ');
  }

  if ((schema.type === 'oneOf' || schema.type === 'anyOf') && schema.schemas) {
    return schema.schemas.map(generateTypeValue).join(' | ');
  }

  if (schema.isEnum && schema.enum) {
    return schema.enum.map((v) => `'${v}'`).join(' | ');
  }

  if (schema.type === 'array' && schema.items) {
    return `Array<${generateTypeValue(schema.items)}>`;
  }

  if (schema.type === 'object' && schema.properties) {
    const props = schema.properties.map(generateProperty).join('\n');
    return `{\n${props}\n}`;
  }

  if (schema.type === 'string')
    return schema.format === 'binary' ? 'File | Blob' : 'string';
  if (schema.type === 'number') return 'number';
  if (schema.type === 'boolean') return 'boolean';
  if (schema.type === 'null') return 'null';

  if (schema.name) return toPascalCase(schema.name);

  return 'unknown';
};
