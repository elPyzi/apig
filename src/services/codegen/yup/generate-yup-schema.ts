import type { IRSchema, ZvyappyConfig } from '@models';
import { toPascalCase, quoteKey } from '@libs/string';
import { generateSchema } from '@services/codegen/typescript/generate-schema';
import { generateYupValue, generateYupProperty } from './value';
import { generateYupEnum } from './enum';
import { withNullable } from './primitives';
import { nativeEnumProps } from '@services/codegen/typescript/inline-enum-names';

export interface YupOpts {
  withTypes: boolean;
  schemaSuffix: string;
}

export const generateYupSchema = (
  schema: IRSchema,
  allSchemas: IRSchema[],
  config: ZvyappyConfig,
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
    const nativeEnums = nativeEnumProps(schema, allSchemas, config, recursive);
    const fields = schema.properties
      .map((prop) => {
        const enumName = nativeEnums.get(prop.name);
        const value = enumName
          ? withNullable(
              `yup.mixed<${enumName}>().oneOf(Object.values(${enumName}) as ${enumName}[])`,
              prop.schema!,
            ) + (prop.required ? '.required()' : '.optional()')
          : generateYupProperty(prop, allSchemas, opts.schemaSuffix, recursive);
        return `  ${quoteKey(prop.name)}: ${value},`;
      })
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
