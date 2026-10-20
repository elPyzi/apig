import type { IRSchema, ApigConfig } from '@models';
import { toPascalCase, quoteKey } from '@libs/string';
import { generateSchema } from '@services/codegen/typescript/generate-schema';
import { generateValibotValue, generateValibotProperty } from './value';
import { generateValibotEnum } from './enum';

export interface ValibotOpts {
  withTypes: boolean;
  schemaSuffix: string;
}

export const generateValibotSchema = (
  schema: IRSchema,
  allSchemas: IRSchema[],
  config: ApigConfig,
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
    const fields = schema.properties
      .map(
        (prop) =>
          `  ${quoteKey(prop.name)}: ${generateValibotProperty(prop, allSchemas, opts.schemaSuffix, recursive)},`,
      )
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
