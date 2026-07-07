import type { IRSchema, ApigConfig } from '@models';
import { toPascalCase } from '@libs/string';
import type { ValibotOpts } from './generate-valibot-schema';

export const generateValibotEnum = (
  schema: IRSchema,
  config: ApigConfig,
  opts: ValibotOpts,
): string => {
  const name = toPascalCase(schema.name!);
  const varName = `${name}${opts.schemaSuffix}`;
  const values = schema.enum!.map((v) => `'${v}'`).join(', ');
  const enumStyle = config.enumStyle ?? 'union';
  const lines: string[] = [];

  if (enumStyle === 'enum') {
    const members = schema.enum!.map((v) => `  ${toPascalCase(v)} = '${v}'`).join(',\n');
    lines.push(`export enum ${name} {\n${members}\n}`);
    lines.push(`export const ${varName} = v.enum(${name});`);
  } else if (enumStyle === 'const') {
    const members = schema.enum!.map((v) => `  ${toPascalCase(v)}: '${v}'`).join(',\n');
    lines.push(`export const ${name} = {\n${members}\n} as const;`);
    if (opts.withTypes)
      lines.push(`export type ${name} = typeof ${name}[keyof typeof ${name}];`);
    lines.push(`export const ${varName} = v.picklist(Object.values(${name}));`);
  } else {
    lines.push(`export const ${varName} = v.picklist([${values}]);`);
    if (opts.withTypes)
      lines.push(`export type ${name} = v.InferOutput<typeof ${varName}>;`);
  }

  return lines.join('\n');
};
