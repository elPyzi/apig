import type { ZvyappyConfig, IRSchema } from '@models';
import { toPascalCase } from '@libs/string';

/**
 * The type name of each inline enum property of an object schema, by property
 * name. `Pet.status` is `PetStatus` — unless the spec already declares a
 * schema by that name, in which case it becomes `PetStatusEnum`. Shared by
 * every generator that has to refer to the declaration.
 */
export const inlineEnumNames = (
  schema: IRSchema,
  allSchemas: IRSchema[],
): Map<string, string> => {
  const names = new Map<string, string>();
  if (!schema.name) return names;

  const owner = toPascalCase(schema.name);
  const taken = new Set(
    allSchemas.filter((s) => s.name).map((s) => toPascalCase(s.name!)),
  );
  for (const prop of schema.properties ?? []) {
    if (!prop.schema?.isEnum || !prop.schema.enum) continue;
    const base = `${owner}${toPascalCase(prop.name)}`;
    let candidate = taken.has(base) ? `${base}Enum` : base;
    for (let i = 2; taken.has(candidate); i++) candidate = `${base}Enum${i}`;
    taken.add(candidate);
    names.set(prop.name, candidate);
  }
  return names;
};

/**
 * Inline enum properties a validator has to check against the enum itself
 * rather than its values — those of a recursive schema under
 * `enumStyle: 'enum'`. Its annotation (`z.ZodType<T>` and the like) types the
 * property as a TypeScript enum, which a union of string literals does not
 * satisfy.
 */
export const nativeEnumProps = (
  schema: IRSchema,
  allSchemas: IRSchema[],
  config: ZvyappyConfig,
  recursive: ReadonlySet<string>,
): Map<string, string> =>
  config.enumStyle === 'enum' && schema.name && recursive.has(schema.name)
    ? inlineEnumNames(schema, allSchemas)
    : new Map();
