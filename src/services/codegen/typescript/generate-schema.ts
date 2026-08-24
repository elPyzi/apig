import type { ApigConfig, IRSchema } from '@models';
import { toPascalCase } from '@libs/string';
import { generateComposition } from '@services/codegen/typescript/generate-composition';
import { generateEnumSchema } from '@services/codegen/typescript/generate-enum-schema';
import { generateObject } from '@services/codegen/typescript/generate-object';
import { generateTypeValue } from '@services/codegen/common/generate-type-value';

export const generateSchema = (
  schema: IRSchema,
  config: ApigConfig,
  allSchemas: IRSchema[],
): string => {
  if (schema.isEnum) return generateEnumSchema(schema, config);

  if (
    schema.type === 'allOf' ||
    schema.type === 'oneOf' ||
    schema.type === 'anyOf'
  ) {
    return generateComposition(schema, allSchemas);
  }

  if (schema.type === 'object')
    return generateObject(schema, config, allSchemas);

  if (schema.name) {
    const name = toPascalCase(schema.name);
    // A schema declares itself here, so it must not resolve to a reference to
    // itself — pass the list without this entry.
    const value = generateTypeValue(
      schema,
      allSchemas.filter((s) => s !== schema),
    );
    return `export type ${name} = ${value};`;
  }

  return '';
};
