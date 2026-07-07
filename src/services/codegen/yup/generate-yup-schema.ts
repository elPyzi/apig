import type { IRSchema, ApigConfig } from '@models';
import { toPascalCase } from '@libs/string';
import { generateYupValue, generateYupProperty } from './value';
import { generateYupEnum } from './enum';

export interface YupOpts {
  withTypes: boolean;
  schemaSuffix: string;
}

export const generateYupSchema = (
  schema: IRSchema,
  allSchemas: IRSchema[],
  config: ApigConfig,
  opts: YupOpts,
): string => {
  if (!schema.name) return '';

  const name = toPascalCase(schema.name);
  const varName = `${name}${opts.schemaSuffix}`;

  if (schema.isEnum && schema.enum)
    return generateYupEnum(schema, config, opts);

  const lines: string[] = [];

  if (schema.type === 'object' && schema.properties) {
    const fields = schema.properties
      .map((prop) => `  ${prop.name}: ${generateYupProperty(prop, allSchemas, opts.schemaSuffix)},`)
      .join('\n');
    lines.push(`export const ${varName} = yup.object({\n${fields}\n});`);
  } else if (schema.type === 'allOf' || schema.type === 'oneOf' || schema.type === 'anyOf') {
    lines.push(
      `export const ${varName} = ${generateYupValue(
        schema,
        allSchemas.filter((s) => s !== schema),
        opts.schemaSuffix,
      )};`,
    );
  } else {
    return '';
  }

  if (opts.withTypes) {
    lines.push(`export type ${name} = yup.InferType<typeof ${varName}>;`);
  }

  return lines.join('\n');
};
