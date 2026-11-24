import type { IRSchema, ZvyappyConfig } from '@models';
import { toPascalCase, quoteKey } from '@libs/string';
import { generateSchema } from '@services/codegen/typescript/generate-schema';
import { generateValibotValue, generateValibotProperty } from './value';
import { generateValibotEnum } from './enum';
import { withNullable } from './primitives';
import { nativeEnumProps } from '@services/codegen/typescript/inline-enum-names';

export interface ValibotOpts {
  withTypes: boolean;
  schemaSuffix: string;
}

export const generateValibotSchema = (
  schema: IRSchema,
  allSchemas: IRSchema[],
  config: ZvyappyConfig,
  opts: ValibotOpts,
  recursive: ReadonlySet<string> = new Set(),
): string => {
  if (!schema.name) return '';

  const name = toPascalCase(schema.name);
  const varName = `${name}${opts.schemaSuffix}`;

  if (schema.isEnum && schema.enum)
    return generateValibotEnum(schema, config, opts);

  // A schema that reaches itself is built lazily, and neither library can infer
  // a type through that — it has to be told what the schema produces.
  const isRecursive = recursive.has(schema.name);
  const ann = isRecursive ? `: v.GenericSchema<${name}>` : '';

  const lines: string[] = [];

  if (schema.type === 'object' && schema.properties) {
    const nativeEnums = nativeEnumProps(schema, allSchemas, config, recursive);
    const fields = schema.properties
      .map((prop) => {
        const enumName = nativeEnums.get(prop.name);
        let value: string;
        if (enumName) {
          value = withNullable(`v.enum(${enumName})`, prop.schema!);
          if (!prop.required) value = `v.optional(${value})`;
        } else
          value = generateValibotProperty(
            prop,
            allSchemas,
            opts.schemaSuffix,
            recursive,
          );
        return `  ${quoteKey(prop.name)}: ${value},`;
      })
      .join('\n');
    lines.push(`export const ${varName}${ann} = v.object({\n${fields}\n});`);
  } else {
    // Everything else — compositions, arrays, primitives, a schema the spec
    // left empty — goes through the value generator. Skipping them left every
    // schema that referenced one pointing at a name that was never emitted.
    lines.push(
      `export const ${varName}${ann} = ${generateValibotValue(
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
    else lines.push(`export type ${name} = v.InferOutput<typeof ${varName}>;`);
  }

  return lines.join('\n');
};
