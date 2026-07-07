import type { IRSchema } from '@models';
import { toPascalCase } from '@libs/string';
import { generateTypeValue } from '@services/codegen/common/generate-type-value';
import { buildJsDoc } from '@services/codegen/common/jsdoc';

export const generateComposition = (schema: IRSchema): string => {
  if (!schema.name || !schema.schemas) return '';

  const name = toPascalCase(schema.name);
  const value = generateTypeValue(schema);
  const doc = buildJsDoc({ description: schema.description });

  return `${doc}export type ${name} = ${value};`;
};
