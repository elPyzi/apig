import type { IRSchema } from '@models';
import { toPascalCase } from '@libs/string';
import { generateValue } from './value';

export const generateFakerFactory = (
  schema: IRSchema,
  allSchemas: IRSchema[],
): string => {
  if (!schema.name) return '';

  const name = toPascalCase(schema.name);
  const fnName = `generate${name}`;

  if (schema.isEnum && schema.enum) {
    const values = schema.enum.map((v) => `'${v}'`).join(', ');
    return `export const ${fnName} = (): ${name} =>\n  faker.helpers.arrayElement([${values}]);`;
  }

  if (schema.type === 'object' && schema.properties) {
    const fields = schema.properties
      .map((prop) => `  ${prop.name}: ${generateValue(prop, allSchemas)},`)
      .join('\n');
    return `export const ${fnName} = (): ${name} => ({\n${fields}\n});`;
  }

  return '';
};
