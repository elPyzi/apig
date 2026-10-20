import type { IRSchema, IRProperty } from '@models';
import { toPascalCase, quoteKey } from '@libs/string';
import { isSchemaReference } from '@services/codegen/common/schema-graph';
import { yupString, yupNumber, withNullable } from './primitives';

export const generateYupValue = (
  schema: IRSchema,
  allSchemas: IRSchema[],
  suffix: string,
  recursive: ReadonlySet<string> = new Set(),
): string => {
  if (isSchemaReference(schema, allSchemas)) {
    const refName = `${toPascalCase(schema.name!)}${suffix}`;
    // no declaration order satisfies a cycle, so anything inside one is lazy
    return recursive.has(schema.name!) ? `yup.lazy(() => ${refName})` : refName;
  }

  if (schema.type === 'allOf' && schema.schemas) {
    const [first, ...rest] = schema.schemas.map((s) =>
      generateYupValue(s, allSchemas, suffix, recursive),
    );
    if (!first) return withNullable('yup.mixed()', schema);
    return withNullable(
      rest.reduce((acc, s) => `${acc}.concat(${s})`, first),
      schema,
    );
  }

  if ((schema.type === 'oneOf' || schema.type === 'anyOf') && schema.schemas) {
    const variants = schema.schemas.map((s) =>
      generateYupValue(s, allSchemas, suffix, recursive),
    );
    return withNullable(`yup.mixed().oneOf([${variants.join(', ')}])`, schema);
  }

  if (schema.isEnum && schema.enum) {
    const values = schema.enum.map((v) => `'${v}'`).join(', ');
    // the generic is what keeps the literal union: a bare `yup.mixed()` infers
    // as `AnyPresentValue`, which no annotated schema accepts
    const union = schema.enum.map((v) => `'${v}'`).join(' | ');
    return withNullable(`yup.mixed<${union}>().oneOf([${values}])`, schema);
  }

  if (schema.type === 'tuple' && schema.prefixItems) {
    const members = schema.prefixItems
      .map((s) => generateYupValue(s, allSchemas, suffix, recursive))
      .join(', ');
    return withNullable(`yup.tuple([${members}])`, schema);
  }

  if (schema.type === 'array' && schema.items) {
    let expr = `yup.array().of(${generateYupValue(schema.items, allSchemas, suffix, recursive)})`;
    if (schema.minItems !== undefined) expr += `.min(${schema.minItems})`;
    if (schema.maxItems !== undefined) expr += `.max(${schema.maxItems})`;
    return withNullable(expr, schema);
  }

  if (schema.type === 'object' && schema.properties) {
    const fields = schema.properties
      .map(
        (prop) =>
          `${quoteKey(prop.name)}: ${generateYupProperty(prop, allSchemas, suffix, recursive)}`,
      )
      .join(', ');
    return withNullable(`yup.object({ ${fields} })`, schema);
  }

  switch (schema.type) {
    case 'string':
      return withNullable(yupString(schema), schema);
    case 'number':
      return withNullable(yupNumber(schema), schema);
    case 'boolean':
      return withNullable('yup.boolean()', schema);
    default:
      return withNullable('yup.mixed()', schema);
  }
};

export const generateYupProperty = (
  prop: IRProperty,
  allSchemas: IRSchema[],
  suffix: string,
  recursive: ReadonlySet<string> = new Set(),
): string => {
  const base = prop.schema
    ? generateYupValue(prop.schema, allSchemas, suffix, recursive)
    : 'yup.mixed()';
  return prop.required ? `${base}.required()` : `${base}.optional()`;
};
