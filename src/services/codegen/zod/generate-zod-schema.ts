import { type IRSchema, type IRProperty, type ApigConfig } from '@models';
import { toPascalCase } from '@libs/string';

const VALID_IDENTIFIER = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
const quoteKey = (name: string): string =>
  VALID_IDENTIFIER.test(name) ? name : `'${name}'`;
import { zodString, zodNumber, withNullable } from './zod-primitives';
import { generateZodEnum } from './generate-zod-enum';
import { generateSchema } from '@services/codegen/typescript/generate-schema';
import { isSchemaReference } from '@services/codegen/common/schema-graph';

export interface ZodOpts {
  infer: boolean;
  input: boolean;
  output: boolean;
  validateResponse: boolean;
  withTypes: boolean;
  schemaSuffix: string;
}

/**
 * Whether this schema stands for a declared schema rather than an inline shape.
 *
 * `IRSchema.name` carries two different things: the target of a `$ref`, and the
 * property key a schema was reached through. A `$ref` arrives carrying nothing
 * but a name, so anything holding its own content is an inline shape — a
 * property called `status` whose schema is an inline enum must not become a
 * reference to an unrelated component that happens to be called `status`.
 */
export const generateZodValue = (
  schema: IRSchema,
  allSchemas: IRSchema[],
  suffix: string,
  ownerName?: string,
  recursive: ReadonlySet<string> = new Set(),
): string => {
  if (isSchemaReference(schema, allSchemas)) {
    const refName = `${toPascalCase(schema.name!)}${suffix}`;
    const isSelf =
      ownerName && toPascalCase(schema.name!) === toPascalCase(ownerName);
    // Anything inside a cycle has to be lazy, not just a direct self-reference:
    // two schemas pointing at each other cannot both be declared first.
    if (isSelf || recursive.has(schema.name!)) {
      return `z.lazy(() => ${refName})`;
    }
    return refName;
  }

  if (schema.type === 'allOf' && schema.schemas) {
    const [first, ...rest] = schema.schemas.map((s) =>
      generateZodValue(s, allSchemas, suffix, ownerName, recursive),
    );
    if (!first) return withNullable('z.unknown()', schema);
    return withNullable(
      rest.reduce((acc, s) => `${acc}.and(${s})`, first),
      schema,
    );
  }

  if ((schema.type === 'oneOf' || schema.type === 'anyOf') && schema.schemas) {
    const variants = schema.schemas.map((s) =>
      generateZodValue(s, allSchemas, suffix, ownerName, recursive),
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

  if (schema.type === 'tuple' && schema.prefixItems) {
    const members = schema.prefixItems
      .map((s) => generateZodValue(s, allSchemas, suffix, ownerName, recursive))
      .join(', ');
    let expr = `z.tuple([${members}])`;
    // `items` alongside `prefixItems` types the variadic remainder
    if (schema.items)
      expr += `.rest(${generateZodValue(schema.items, allSchemas, suffix, ownerName, recursive)})`;
    return withNullable(expr, schema);
  }

  if (schema.type === 'array' && schema.items) {
    let expr = `z.array(${generateZodValue(schema.items, allSchemas, suffix, ownerName, recursive)})`;
    if (schema.minItems !== undefined) expr += `.min(${schema.minItems})`;
    if (schema.maxItems !== undefined) expr += `.max(${schema.maxItems})`;
    return withNullable(expr, schema);
  }

  if (schema.type === 'object' && schema.properties) {
    const fields = schema.properties
      .map(
        (prop) =>
          `${quoteKey(prop.name)}: ${generateZodProperty(prop, allSchemas, suffix, ownerName, recursive)}`,
      )
      .join(', ');
    return withNullable(`z.object({ ${fields} })`, schema);
  }

  switch (schema.type) {
    case 'string':
      return withNullable(zodString(schema), schema);
    case 'number':
      return withNullable(zodNumber(schema), schema);
    case 'boolean':
      return withNullable('z.boolean()', schema);
    case 'null':
      return 'z.null()';
    default:
      return withNullable('z.unknown()', schema);
  }
};

export const generateZodProperty = (
  prop: IRProperty,
  allSchemas: IRSchema[],
  suffix: string,
  ownerName?: string,
  recursive: ReadonlySet<string> = new Set(),
): string => {
  const base = prop.schema
    ? generateZodValue(prop.schema, allSchemas, suffix, ownerName, recursive)
    : 'z.unknown()';
  return prop.required ? base : `${base}.optional()`;
};

export const generateZodSchema = (
  schema: IRSchema,
  allSchemas: IRSchema[],
  config: ApigConfig,
  opts: ZodOpts,
  recursive: ReadonlySet<string> = new Set(),
): string => {
  if (!schema.name) return '';

  const name = toPascalCase(schema.name);
  const varName = `${name}${opts.schemaSuffix}`;
  // A schema that reaches itself is built with `z.lazy`, and TypeScript cannot
  // infer a type through that — it needs to be told what the schema produces.
  const isRecursive = recursive.has(schema.name);
  const ann = isRecursive ? `: z.ZodType<${name}>` : '';

  if (schema.isEnum && schema.enum)
    return generateZodEnum(schema, config, opts);

  const lines: string[] = [];

  if (schema.type === 'object' && schema.properties) {
    const fields = schema.properties
      .map(
        (prop) =>
          `  ${quoteKey(prop.name)}: ${generateZodProperty(prop, allSchemas, opts.schemaSuffix, schema.name, recursive)},`,
      )
      .join('\n');
    lines.push(`export const ${varName}${ann} = z.object({\n${fields}\n});`);
  } else if (schema.type === 'object') {
    lines.push(
      `export const ${varName}${ann} = z.record(z.string(), z.unknown());`,
    );
  } else if (
    schema.type === 'allOf' ||
    schema.type === 'oneOf' ||
    schema.type === 'anyOf'
  ) {
    lines.push(
      `export const ${varName}${ann} = ${generateZodValue(
        schema,
        allSchemas.filter((s) => s !== schema),
        opts.schemaSuffix,
        schema.name,
        recursive,
      )};`,
    );
  } else if (schema.type === 'array' && schema.items) {
    lines.push(
      `export const ${varName}${ann} = z.array(${generateZodValue(schema.items, allSchemas, opts.schemaSuffix, undefined, recursive)});`,
    );
  } else if (schema.type === 'string') {
    lines.push(
      `export const ${varName}${ann} = ${generateZodValue(schema, allSchemas, opts.schemaSuffix, undefined, recursive)};`,
    );
  } else if (schema.type === 'number') {
    lines.push(
      `export const ${varName}${ann} = ${generateZodValue(schema, allSchemas, opts.schemaSuffix, undefined, recursive)};`,
    );
  } else if (schema.type === 'boolean') {
    lines.push(`export const ${varName}${ann} = z.boolean();`);
  } else {
    // A declared schema always gets a declaration, even when the spec gives it
    // nothing to work with (`ErrorInfo: {}`). Skipping it left every schema
    // referencing it pointing at a name that was never emitted.
    lines.push(`export const ${varName}${ann} = z.unknown();`);
  }

  if (opts.withTypes) {
    // `z.infer` off a recursive schema is circular, so the shape is spelled out
    // instead — the same declaration the typescript plugin would emit.
    if (isRecursive) {
      lines.unshift(generateSchema(schema, config, allSchemas));
    } else if (opts.infer)
      lines.push(`export type ${name} = z.infer<typeof ${varName}>;`);
    if (opts.input)
      lines.push(`export type ${name}Input = z.input<typeof ${varName}>;`);
    if (opts.output)
      lines.push(`export type ${name}Output = z.output<typeof ${varName}>;`);
  }

  if (opts.validateResponse) {
    const retType =
      opts.withTypes && opts.infer ? name : `z.infer<typeof ${varName}>`;
    lines.push(
      `export const validate${name}Response = (data: unknown): ${retType} => ${varName}.parse(data);`,
    );
  }

  return lines.join('\n');
};
