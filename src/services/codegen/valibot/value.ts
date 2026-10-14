import type { IRSchema, IRProperty } from '@models';
import { toPascalCase, quoteKey } from '@libs/string';
import { isSchemaReference } from '@services/codegen/common/schema-graph';
import { valibotString, valibotNumber, withNullable } from './primitives';

export const generateValibotValue = (
  schema: IRSchema,
  allSchemas: IRSchema[],
  suffix: string,
  recursive: ReadonlySet<string> = new Set(),
): string => {
  if (isSchemaReference(schema, allSchemas)) {
    const refName = `${toPascalCase(schema.name!)}${suffix}`;
    // no declaration order satisfies a cycle, so anything inside one is lazy
    return recursive.has(schema.name!) ? `v.lazy(() => ${refName})` : refName;
  }

  if (schema.type === 'allOf' && schema.schemas) {
    const parts = schema.schemas.map((s) =>
      generateValibotValue(s, allSchemas, suffix, recursive),
    );
    return withNullable(`v.intersect([${parts.join(', ')}])`, schema);
  }

  if ((schema.type === 'oneOf' || schema.type === 'anyOf') && schema.schemas) {
    const variants = schema.schemas.map((s) =>
      generateValibotValue(s, allSchemas, suffix, recursive),
    );
    const expr = schema.discriminator
      ? `v.variant('${schema.discriminator}', [${variants.join(', ')}])`
      : `v.union([${variants.join(', ')}])`;
    return withNullable(expr, schema);
  }

  if (schema.isEnum && schema.enum) {
    const values = schema.enum.map((v) => `'${v}'`).join(', ');
    return withNullable(`v.picklist([${values}])`, schema);
  }

  if (schema.type === 'tuple' && schema.prefixItems) {
    const members = schema.prefixItems
      .map((s) => generateValibotValue(s, allSchemas, suffix, recursive))
      .join(', ');
    // `items` alongside `prefixItems` types the variadic remainder
    const expr = schema.items
      ? `v.tupleWithRest([${members}], ${generateValibotValue(schema.items, allSchemas, suffix, recursive)})`
      : `v.tuple([${members}])`;
    return withNullable(expr, schema);
  }

  if (schema.type === 'array' && schema.items) {
    const pipes: string[] = [
      `v.array(${generateValibotValue(schema.items, allSchemas, suffix, recursive)})`,
    ];
    if (schema.minItems !== undefined)
      pipes.push(`v.minLength(${schema.minItems})`);
    if (schema.maxItems !== undefined)
      pipes.push(`v.maxLength(${schema.maxItems})`);
    const expr = pipes.length === 1 ? pipes[0]! : `v.pipe(${pipes.join(', ')})`;
    return withNullable(expr, schema);
  }

  if (schema.type === 'object' && schema.properties) {
    const fields = schema.properties
      .map(
        (prop) =>
          `${quoteKey(prop.name)}: ${generateValibotProperty(prop, allSchemas, suffix, recursive)}`,
      )
      .join(', ');
    return withNullable(`v.object({ ${fields} })`, schema);
  }

  switch (schema.type) {
    case 'string':
      return withNullable(valibotString(schema), schema);
    case 'number':
      return withNullable(valibotNumber(schema), schema);
    case 'boolean':
      return withNullable('v.boolean()', schema);
    case 'null':
      return 'v.null_()';
    default:
      return withNullable('v.unknown()', schema);
  }
};

export const generateValibotProperty = (
  prop: IRProperty,
  allSchemas: IRSchema[],
  suffix: string,
  recursive: ReadonlySet<string> = new Set(),
): string => {
  const base = prop.schema
    ? generateValibotValue(prop.schema, allSchemas, suffix, recursive)
    : 'v.unknown()';
  return prop.required ? base : `v.optional(${base})`;
};
