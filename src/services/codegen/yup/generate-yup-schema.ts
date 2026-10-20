import type { IRSchema, ApigConfig } from '@models';
import { toPascalCase, quoteKey } from '@libs/string';
import { generateSchema } from '@services/codegen/typescript/generate-schema';
import { generateYupValue, generateYupProperty } from './value';
import { generateYupEnum } from './enum';

export interface YupOpts {
  withTypes: boolean;
  schemaSuffix: string;
}

export const generateYupSchema = (
  schema: IRSchema,
  allSchemas: IRSchema[],
  config: ApigConfig,
  opts: YupOpts,
  recursive: ReadonlySet<string> = new Set(),
): string => {
  if (!schema.name) return '';

  const name = toPascalCase(schema.name);
  const varName = `${name}${opts.schemaSuffix}`;

  if (schema.isEnum && schema.enum)
    return generateYupEnum(schema, config, opts);

  // A schema that reaches itself is built lazily, and neither library can infer
  // a type through that — it has to be told what the schema produces.
  const isRecursive = recursive.has(schema.name);
  const ann = isRecursive ? `: yup.Schema<${name}>` : '';

  const lines: string[] = [];

  if (schema.type === 'object' && schema.properties) {
    const fields = schema.properties
      .map(
        (prop) =>
          `  ${quoteKey(prop.name)}: ${generateYupProperty(prop, allSchemas, opts.schemaSuffix, recursive)},`,
      )
      .join('\n');
    lines.push(`export const ${varName}${ann} = yup.object({\n${fields}\n});`);
  } else {
    // Everything else — compositions, arrays, primitives, a schema the spec
    // left empty — goes through the value generator. Skipping them left every
    // schema that referenced one pointing at a name that was never emitted.
    lines.push(
      `export const ${varName}${ann} = ${generateYupValue(
        schema,
        allSchemas.filter((s) => s !== schema),
        opts.schemaSuffix,
        recursive,
      )};`,
    );
  }

  if (opts.withTypes) {
    // inference off a lazy schema is circular, so the shape is spelled out
    if (isRecursive) lines.unshift(generateSchema(schema, config, allSchemas));
    else lines.push(`export type ${name} = yup.InferType<typeof ${varName}>;`);
  }

  return lines.join('\n');
};
