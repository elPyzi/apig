import type { IRSchema, IRProperty } from '@models';
import { toPascalCase } from '@libs/string';
import { yupString, yupNumber, withNullable } from './primitives';

export const generateYupValue = (
  schema: IRSchema,
  allSchemas: IRSchema[],
  suffix: string,
): string => {
  if (schema.name && allSchemas.some((s) => s.name === schema.name)) {
    return `${toPascalCase(schema.name)}${suffix}`;
  }

  if (schema.type === 'allOf' && schema.schemas) {
    const [first, ...rest] = schema.schemas.map((s) => generateYupValue(s, allSchemas, suffix));
    return withNullable(rest.reduce((acc, s) => `${acc}.concat(${s})`, first), schema);
  }

  if ((schema.type === 'oneOf' || schema.type === 'anyOf') && schema.schemas) {
    const variants = schema.schemas.map((s) => generateYupValue(s, allSchemas, suffix));
    return withNullable(`yup.mixed().oneOf([${variants.join(', ')}])`, schema);
  }

  if (schema.isEnum && schema.enum) {
    const values = schema.enum.map((v) => `'${v}'`).join(', ');
    return withNullable(`yup.mixed().oneOf([${values}])`, schema);
  }

  if (schema.type === 'array' && schema.items) {
    let expr = `yup.array().of(${generateYupValue(schema.items, allSchemas, suffix)})`;
    if (schema.minItems !== undefined) expr += `.min(${schema.minItems})`;
    if (schema.maxItems !== undefined) expr += `.max(${schema.maxItems})`;
    return withNullable(expr, schema);
  }

  if (schema.type === 'object' && schema.properties) {
    const fields = schema.properties
      .map((prop) => `${prop.name}: ${generateYupProperty(prop, allSchemas, suffix)}`)
      .join(', ');
    return withNullable(`yup.object({ ${fields} })`, schema);
  }

  switch (schema.type) {
    case 'string':  return withNullable(yupString(schema), schema);
    case 'number':  return withNullable(yupNumber(schema), schema);
    case 'boolean': return withNullable('yup.boolean()', schema);
    default:        return withNullable('yup.mixed()', schema);
  }
};

export const generateYupProperty = (
  prop: IRProperty,
  allSchemas: IRSchema[],
  suffix: string,
): string => {
  const base = prop.schema
    ? generateYupValue(prop.schema, allSchemas, suffix)
    : 'yup.mixed()';
  return prop.required ? `${base}.required()` : `${base}.optional()`;
};
