import { ENUM_STYLES, type ApigConfig, type IRSchema } from '@models';
import { toPascalCase } from '@libs/string';
import { buildJsDoc } from '@services/codegen/common/jsdoc';

export const generateEnumSchema = (
  schema: IRSchema,
  config: ApigConfig,
): string => {
  if (!schema.name || !schema.enum) return '';

  const name = toPascalCase(schema.name);
  const style = config.enumStyle ?? ENUM_STYLES.CONST;
  const doc = buildJsDoc({ description: schema.description });

  if (style === ENUM_STYLES.UNION) {
    const values = schema.enum.map((v) => `'${v}'`).join(' | ');
    return `${doc}export type ${name} = ${values};`;
  }

  if (style === ENUM_STYLES.ENUM) {
    const members = schema.enum
      .map((v) => `  ${toPascalCase(v)} = '${v}'`)
      .join(',\n');
    return `${doc}export enum ${name} {\n${members}\n}`;
  }

  if (style === ENUM_STYLES.CONST) {
    const members = schema.enum
      .map((v) => `  ${toPascalCase(v)}: '${v}'`)
      .join(',\n');
    return [
      `${doc}export const ${name} = {\n${members}\n} as const;`,
      `export type ${name} = typeof ${name}[keyof typeof ${name}];`,
    ].join('\n');
  }

  return '';
};
