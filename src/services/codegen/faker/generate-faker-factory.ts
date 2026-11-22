import type { IRSchema } from '@models';
import { quoteKey, toPascalCase, toStringLiteral } from '@libs/string';
import { fieldValue, generateValue, type FakerContext } from './value';

export const generateFakerFactory = (
  schema: IRSchema,
  allSchemas: IRSchema[],
  recursive: Set<string> = new Set(),
): string => {
  if (!schema.name) return '';

  const name = toPascalCase(schema.name);
  const fnName = `generate${name}`;
  // a schema that reaches itself gets a depth counter, so its factory stops
  // instead of calling itself until the stack overflows
  const guarded = recursive.has(schema.name);
  const ctx: FakerContext = { recursive, guarded };
  const params = guarded ? 'depth = 0' : '';

  if (schema.isEnum && schema.enum) {
    const values = schema.enum.map((v) => toStringLiteral(v)).join(', ');
    return `export const ${fnName} = (): ${name} =>\n  faker.helpers.arrayElement([${values}]);`;
  }

  if (schema.type === 'object' && schema.properties) {
    const fields = schema.properties
      .map(
        (prop) =>
          `  ${quoteKey(prop.name)}: ${fieldValue(prop, allSchemas, ctx)},`,
      )
      .join('\n');
    return `export const ${fnName} = (${params}): ${name} => ({\n${fields}\n});`;
  }

  // Arrays, primitives and schemas the spec left empty used to produce nothing
  // at all, while every factory referencing them still called them by name.
  // The list excludes this schema so the value does not resolve to itself.
  const value = generateValue(
    { name: schema.name, required: true, type: schema.type, schema },
    allSchemas.filter((s) => s !== schema),
    ctx,
  );
  return `export const ${fnName} = (${params}): ${name} => ${value};`;
};
