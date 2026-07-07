import type { IRSchema, ApigConfig } from '@models';
import { toPascalCase } from '@libs/string';
import type { YupOpts } from './generate-yup-schema';

export const generateYupEnum = (
  schema: IRSchema,
  config: ApigConfig,
  opts: YupOpts,
): string => {
  const name = toPascalCase(schema.name!);
  const varName = `${name}${opts.schemaSuffix}`;
  const values = schema.enum!.map((v) => `'${v}'`).join(', ');
  const enumStyle = config.enumStyle ?? 'union';
  const lines: string[] = [];

  if (enumStyle === 'enum') {
    const members = schema.enum!.map((v) => `  ${toPascalCase(v)} = '${v}'`).join(',\n');
    lines.push(`export enum ${name} {\n${members}\n}`);
    lines.push(
      `export const ${varName} = yup.mixed<${name}>().oneOf(Object.values(${name}) as ${name}[]).required();`,
    );
  } else if (enumStyle === 'const') {
    const members = schema.enum!.map((v) => `  ${toPascalCase(v)}: '${v}'`).join(',\n');
    lines.push(`export const ${name} = {\n${members}\n} as const;`);
    if (opts.withTypes)
      lines.push(`export type ${name} = typeof ${name}[keyof typeof ${name}];`);
    lines.push(
      `export const ${varName} = yup.mixed<${name}>().oneOf(Object.values(${name}) as ${name}[]).required();`,
    );
  } else {
    lines.push(`export const ${varName} = yup.mixed().oneOf([${values}] as const).required();`);
    if (opts.withTypes)
      lines.push(`export type ${name} = yup.InferType<typeof ${varName}>;`);
  }

  return lines.join('\n');
};
