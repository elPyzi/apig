import type { IRSchema } from '@models';
import { toPascalCase } from '@libs/string';
import { generateProperty } from '@services/codegen/common/generate-property';

/**
 * Renders a schema as an inline TypeScript type.
 *
 * `allSchemas` is the list of top-level schemas that actually get declared.
 * It is required because `IRSchema.name` carries two different things: the
 * target of a `$ref`, and the property name a schema was reached through.
 * Emitting a reference without checking this list produces a type that is
 * never declared — that is how `{ "type": ["string", "null"] }` used to turn
 * into a dangling `Note` on a property called `note`.
 */
export const generateTypeValue = (
  schema: IRSchema,
  allSchemas: IRSchema[],
): string => {
  const value = renderType(schema, allSchemas);
  // `| null` binds loosest, so it is safe to append to unions, intersections
  // and object literals alike without parenthesising.
  return schema.nullable ? `${value} | null` : value;
};

const renderType = (schema: IRSchema, allSchemas: IRSchema[]): string => {
  if (schema.type === 'allOf' && schema.schemas) {
    return schema.schemas
      .map((s) => generateTypeValue(s, allSchemas))
      .join(' & ');
  }

  if ((schema.type === 'oneOf' || schema.type === 'anyOf') && schema.schemas) {
    return schema.schemas
      .map((s) => generateTypeValue(s, allSchemas))
      .join(' | ');
  }

  if (schema.isEnum && schema.enum) {
    return schema.enum.map((v) => `'${v}'`).join(' | ');
  }

  if (schema.type === 'tuple' && schema.prefixItems) {
    const members = schema.prefixItems.map((s) =>
      generateTypeValue(s, allSchemas),
    );
    // `items` alongside `prefixItems` types the variadic remainder
    const rest = schema.items
      ? [`...${generateTypeValue(schema.items, allSchemas)}[]`]
      : [];
    return `[${[...members, ...rest].join(', ')}]`;
  }

  if (schema.type === 'array' && schema.items) {
    return `Array<${generateTypeValue(schema.items, allSchemas)}>`;
  }

  if (schema.type === 'object' && schema.properties) {
    const props = schema.properties
      .map((prop) => generateProperty(prop, allSchemas))
      .join('\n');
    return `{\n${props}\n}`;
  }

  if (schema.type === 'string')
    return schema.format === 'binary' ? 'File | Blob' : 'string';
  if (schema.type === 'number') return 'number';
  if (schema.type === 'boolean') return 'boolean';
  if (schema.type === 'null') return 'null';

  if (isDeclaredSchema(schema, allSchemas)) return toPascalCase(schema.name!);

  return 'unknown';
};

/** Whether `schema.name` refers to a schema that is actually declared in the output. */
export const isDeclaredSchema = (
  schema: IRSchema,
  allSchemas: IRSchema[],
): boolean =>
  Boolean(schema.name) && allSchemas.some((s) => s.name === schema.name);
