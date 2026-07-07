import { type IRSchema } from '@models';

export const zodString = (schema: IRSchema): string => {
  if (schema.format === 'binary') return 'z.instanceof(File)';
  let s = 'z.string()';
  switch (schema.format) {
    case 'email':      s = 'z.string().email()'; break;
    case 'uuid':       s = 'z.string().uuid()'; break;
    case 'uri':
    case 'url':        s = 'z.string().url()'; break;
    case 'date-time':  s = 'z.string().datetime()'; break;
    case 'date':       s = 'z.string().date()'; break;
  }
  if (schema.minLength !== undefined) s += `.min(${schema.minLength})`;
  if (schema.maxLength !== undefined) s += `.max(${schema.maxLength})`;
  if (schema.pattern) s += `.regex(/${schema.pattern}/)`;
  return s;
};

export const zodNumber = (schema: IRSchema): string => {
  let s = 'z.number()';
  if (schema.minimum !== undefined) s += `.min(${schema.minimum})`;
  if (schema.maximum !== undefined) s += `.max(${schema.maximum})`;
  return s;
};

export const withNullable = (expr: string, schema: IRSchema): string =>
  schema.nullable ? `${expr}.nullable()` : expr;
