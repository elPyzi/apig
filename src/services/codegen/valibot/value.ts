import type { IRSchema, IRProperty } from '@models';
import { toPascalCase } from '@libs/string';
import { valibotString, valibotNumber, withNullable } from './primitives';

export const generateValibotValue = (
  schema: IRSchema,
  allSchemas: IRSchema[],
  suffix: string,
): string => {
  if (schema.name && allSchemas.some((s) => s.name === schema.name)) {
    return `${toPascalCase(schema.name)}${suffix}`;
  }

  if (schema.type === 'allOf' && schema.schemas) {
    const parts = schema.schemas.map((s) => generateValibotValue(s, allSchemas, suffix));
    return withNullable(`v.intersect([${parts.join(', ')}])`, schema);
  }

  if ((schema.type === 'oneOf' || schema.type === 'anyOf') && schema.schemas) {
    const variants = schema.schemas.map((s) => generateValibotValue(s, allSchemas, suffix));
    const expr = schema.discriminator
      ? `v.variant('${schema.discriminator}', [${variants.join(', ')}])`
      : `v.union([${variants.join(', ')}])`;
    return withNullable(expr, schema);
  }

  if (schema.isEnum && schema.enum) {
    const values = schema.enum.map((v) => `'${v}'`).join(', ');
    return withNullable(`v.picklist([${values}])`, schema);
  }

  if (schema.type === 'array' && schema.items) {
    const pipes: string[] = [`v.array(${generateValibotValue(schema.items, allSchemas, suffix)})`];
    if (schema.minItems !== undefined) pipes.push(`v.minLength(${schema.minItems})`);
    if (schema.maxItems !== undefined) pipes.push(`v.maxLength(${schema.maxItems})`);
    const expr = pipes.length === 1 ? pipes[0]! : `v.pipe(${pipes.join(', ')})`;
    return withNullable(expr, schema);
  }

  if (schema.type === 'object' && schema.properties) {
    const fields = schema.properties
      .map((prop) => `${prop.name}: ${generateValibotProperty(prop, allSchemas, suffix)}`)
      .join(', ');
    return withNullable(`v.object({ ${fields} })`, schema);
  }

  switch (schema.type) {
    case 'string':  return withNullable(valibotString(schema), schema);
    case 'number':  return withNullable(valibotNumber(schema), schema);
    case 'boolean': return withNullable('v.boolean()', schema);
    case 'null':    return 'v.null_()';
    default:        return withNullable('v.unknown()', schema);
  }
};

export const generateValibotProperty = (
  prop: IRProperty,
  allSchemas: IRSchema[],
  suffix: string,
): string => {
  const base = prop.schema
    ? generateValibotValue(prop.schema, allSchemas, suffix)
    : 'v.unknown()';
  return prop.required ? base : `v.optional(${base})`;
};
