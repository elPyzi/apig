import { type IRSchema, type IRProperty, type ApigConfig } from '@models';
import { toPascalCase } from '@libs/string';

const VALID_IDENTIFIER = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
const quoteKey = (name: string): string =>
  VALID_IDENTIFIER.test(name) ? name : `'${name}'`;
import { zodString, zodNumber, withNullable } from './zod-primitives';
import { generateZodEnum } from './generate-zod-enum';

export interface ZodOpts {
  infer: boolean;
  input: boolean;
  output: boolean;
  validateResponse: boolean;
  withTypes: boolean;
  schemaSuffix: string;
}

export const generateZodValue = (
  schema: IRSchema,
  allSchemas: IRSchema[],
  suffix: string,
  ownerName?: string,
): string => {
  if (schema.name && allSchemas.some((s) => s.name === schema.name)) {
    const refName = `${toPascalCase(schema.name)}${suffix}`;
    if (ownerName && toPascalCase(schema.name) === toPascalCase(ownerName)) {
      return `z.lazy(() => ${refName})`;
    }
    return refName;
  }

  if (schema.type === 'allOf' && schema.schemas) {
    const [first, ...rest] = schema.schemas.map((s) =>
      generateZodValue(s, allSchemas, suffix, ownerName),
    );
    return withNullable(
      rest.reduce((acc, s) => `${acc}.and(${s})`, first),
      schema,
    );
  }

  if ((schema.type === 'oneOf' || schema.type === 'anyOf') && schema.schemas) {
    const variants = schema.schemas.map((s) =>
      generateZodValue(s, allSchemas, suffix, ownerName),
    );
    const expr = schema.discriminator
      ? `z.discriminatedUnion('${schema.discriminator}', [${variants.join(', ')}])`
      : `z.union([${variants.join(', ')}])`;
    return withNullable(expr, schema);
  }

  if (schema.isEnum && schema.enum) {
    const values = schema.enum.map((v) => `'${v}'`).join(', ');
    return withNullable(`z.enum([${values}])`, schema);
  }

  if (schema.type === 'array' && schema.items) {
    let expr = `z.array(${generateZodValue(schema.items, allSchemas, suffix, ownerName)})`;
    if (schema.minItems !== undefined) expr += `.min(${schema.minItems})`;
    if (schema.maxItems !== undefined) expr += `.max(${schema.maxItems})`;
    return withNullable(expr, schema);
  }

  if (schema.type === 'object' && schema.properties) {
    const fields = schema.properties
      .map((prop) => `${quoteKey(prop.name)}: ${generateZodProperty(prop, allSchemas, suffix, ownerName)}`)
      .join(', ');
    return withNullable(`z.object({ ${fields} })`, schema);
  }

  switch (schema.type) {
    case 'string':  return withNullable(zodString(schema), schema);
    case 'number':  return withNullable(zodNumber(schema), schema);
    case 'boolean': return withNullable('z.boolean()', schema);
    case 'null':    return 'z.null()';
    default:        return withNullable('z.unknown()', schema);
  }
};

export const generateZodProperty = (
  prop: IRProperty,
  allSchemas: IRSchema[],
  suffix: string,
  ownerName?: string,
): string => {
  const base = prop.schema
    ? generateZodValue(prop.schema, allSchemas, suffix, ownerName)
    : 'z.unknown()';
  return prop.required ? base : `${base}.optional()`;
};

export const generateZodSchema = (
  schema: IRSchema,
  allSchemas: IRSchema[],
  config: ApigConfig,
  opts: ZodOpts,
): string => {
  if (!schema.name) return '';

  const name = toPascalCase(schema.name);
  const varName = `${name}${opts.schemaSuffix}`;

  if (schema.isEnum && schema.enum)
    return generateZodEnum(schema, config, opts);

  const lines: string[] = [];

  if (schema.type === 'object' && schema.properties) {
    const fields = schema.properties
      .map((prop) => `  ${quoteKey(prop.name)}: ${generateZodProperty(prop, allSchemas, opts.schemaSuffix, schema.name)},`)
      .join('\n');
    lines.push(`export const ${varName} = z.object({\n${fields}\n});`);
  } else if (schema.type === 'object') {
    lines.push(`export const ${varName} = z.record(z.string(), z.unknown());`);
  } else if (schema.type === 'allOf' || schema.type === 'oneOf' || schema.type === 'anyOf') {
    lines.push(
      `export const ${varName} = ${generateZodValue(
        schema,
        allSchemas.filter((s) => s !== schema),
        opts.schemaSuffix,
        schema.name,
      )};`,
    );
  } else if (schema.type === 'array' && schema.items) {
    lines.push(`export const ${varName} = z.array(${generateZodValue(schema.items, allSchemas, opts.schemaSuffix)});`);
  } else if (schema.type === 'string') {
    lines.push(`export const ${varName} = ${generateZodValue(schema, allSchemas, opts.schemaSuffix)};`);
  } else if (schema.type === 'number') {
    lines.push(`export const ${varName} = ${generateZodValue(schema, allSchemas, opts.schemaSuffix)};`);
  } else if (schema.type === 'boolean') {
    lines.push(`export const ${varName} = z.boolean();`);
  } else {
    return '';
  }

  if (opts.withTypes) {
    if (opts.infer)  lines.push(`export type ${name} = z.infer<typeof ${varName}>;`);
    if (opts.input)  lines.push(`export type ${name}Input = z.input<typeof ${varName}>;`);
    if (opts.output) lines.push(`export type ${name}Output = z.output<typeof ${varName}>;`);
  }

  if (opts.validateResponse) {
    const retType = opts.withTypes && opts.infer ? name : `z.infer<typeof ${varName}>`;
    lines.push(
      `export const validate${name}Response = (data: unknown): ${retType} => ${varName}.parse(data);`,
    );
  }

  return lines.join('\n');
};
