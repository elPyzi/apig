import type { IRSchema } from '@models';

export const yupString = (schema: IRSchema): string => {
  if (schema.format === 'binary') return 'yup.mixed<File>()';
  let s = 'yup.string()';
  switch (schema.format) {
    case 'email': s = 'yup.string().email()'; break;
    case 'uuid': s = 'yup.string().uuid()'; break;
    case 'uri':
    case 'url': s = 'yup.string().url()'; break;
  }
  if (schema.minLength !== undefined) s += `.min(${schema.minLength})`;
  if (schema.maxLength !== undefined) s += `.max(${schema.maxLength})`;
  if (schema.pattern) s += `.matches(/${schema.pattern}/)`;
  return s;
};

export const yupNumber = (schema: IRSchema): string => {
  let s = 'yup.number()';
  if (schema.minimum !== undefined) s += `.min(${schema.minimum})`;
  if (schema.maximum !== undefined) s += `.max(${schema.maximum})`;
  return s;
};

export const withNullable = (expr: string, schema: IRSchema): string =>
  schema.nullable ? `${expr}.nullable()` : expr;
