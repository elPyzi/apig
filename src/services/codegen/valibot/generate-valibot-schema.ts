import type { IRSchema, ApigConfig } from '@models';
import { toPascalCase } from '@libs/string';
import { generateValibotValue, generateValibotProperty } from './value';
import { generateValibotEnum } from './enum';

export interface ValibotOpts {
  withTypes: boolean;
  schemaSuffix: string;
}

export const generateValibotSchema = (
  schema: IRSchema,
  allSchemas: IRSchema[],
  config: ApigConfig,
  opts: ValibotOpts,
): string => {
  if (!schema.name) return '';

  const name = toPascalCase(schema.name);
  const varName = `${name}${opts.schemaSuffix}`;

  if (schema.isEnum && schema.enum)
    return generateValibotEnum(schema, config, opts);

  const lines: string[] = [];

  if (schema.type === 'object' && schema.properties) {
    const fields = schema.properties
      .map((prop) => `  ${prop.name}: ${generateValibotProperty(prop, allSchemas, opts.schemaSuffix)},`)
      .join('\n');
    lines.push(`export const ${varName} = v.object({\n${fields}\n});`);
  } else if (schema.type === 'allOf' || schema.type === 'oneOf' || schema.type === 'anyOf') {
    lines.push(
      `export const ${varName} = ${generateValibotValue(
        schema,
        allSchemas.filter((s) => s !== schema),
        opts.schemaSuffix,
      )};`,
    );
  } else {
    return '';
  }

  if (opts.withTypes) {
    lines.push(`export type ${name} = v.InferOutput<typeof ${varName}>;`);
  }

  return lines.join('\n');
};
