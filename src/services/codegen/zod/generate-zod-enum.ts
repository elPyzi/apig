import { type IRSchema, type ApigConfig } from '@models';
import { toPascalCase } from '@libs/string';
import { type ZodOpts } from './generate-zod-schema';

export const generateZodEnum = (
  schema: IRSchema,
  config: ApigConfig,
  opts: ZodOpts,
): string => {
  const name = toPascalCase(schema.name!);
  const varName = `${name}${opts.schemaSuffix}`;
  const values = schema.enum!.map((v) => `'${v}'`).join(', ');
  const enumStyle = config.enumStyle ?? 'union';
  const lines: string[] = [];

  if (enumStyle === 'enum') {
    const members = schema.enum!.map((v) => `  ${toPascalCase(v)} = '${v}'`).join(',\n');
    lines.push(`export enum ${name} {\n${members}\n}`);
    lines.push(`export const ${varName} = z.nativeEnum(${name});`);
  } else if (enumStyle === 'const') {
    const members = schema.enum!.map((v) => `  ${toPascalCase(v)}: '${v}'`).join(',\n');
    lines.push(`export const ${name} = {\n${members}\n} as const;`);
    if (opts.withTypes)
      lines.push(`export type ${name} = typeof ${name}[keyof typeof ${name}];`);
    lines.push(`export const ${varName} = z.nativeEnum(${name});`);
  } else {
    lines.push(`export const ${varName} = z.enum([${values}]);`);
    if (opts.withTypes && opts.infer)
      lines.push(`export type ${name} = z.infer<typeof ${varName}>;`);
  }

  if (opts.validateResponse) {
    const retType = opts.withTypes && opts.infer ? name : `z.infer<typeof ${varName}>`;
    lines.push(
      `export const validate${name}Response = (data: unknown): ${retType} => ${varName}.parse(data);`,
    );
  }

  return lines.join('\n');
};
