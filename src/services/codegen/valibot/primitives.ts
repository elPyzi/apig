import type { IRSchema } from '@models';

export const valibotString = (schema: IRSchema): string => {
  if (schema.format === 'binary') return 'v.instance(File)';
  const pipes: string[] = ['v.string()'];
  switch (schema.format) {
    case 'email': pipes.push('v.email()'); break;
    case 'uuid': pipes.push('v.uuid()'); break;
    case 'uri':
    case 'url': pipes.push('v.url()'); break;
    case 'date-time': pipes.push('v.isoTimestamp()'); break;
    case 'date': pipes.push('v.isoDate()'); break;
  }
  if (schema.minLength !== undefined) pipes.push(`v.minLength(${schema.minLength})`);
  if (schema.maxLength !== undefined) pipes.push(`v.maxLength(${schema.maxLength})`);
  if (schema.pattern) pipes.push(`v.regex(/${schema.pattern}/)`);
  return pipes.length === 1 ? pipes[0]! : `v.pipe(${pipes.join(', ')})`;
};

export const valibotNumber = (schema: IRSchema): string => {
  const pipes: string[] = ['v.number()'];
  if (schema.minimum !== undefined) pipes.push(`v.minValue(${schema.minimum})`);
  if (schema.maximum !== undefined) pipes.push(`v.maxValue(${schema.maximum})`);
  return pipes.length === 1 ? pipes[0]! : `v.pipe(${pipes.join(', ')})`;
};

export const withNullable = (expr: string, schema: IRSchema): string =>
  schema.nullable ? `v.nullable(${expr})` : expr;
