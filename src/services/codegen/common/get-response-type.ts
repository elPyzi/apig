import type { IRSchema } from '@models';
import { toPascalCase } from '@libs/string';
import { isDeclaredSchema } from '@services/codegen/common/generate-type-value';

/**
 * TypeScript type of an operation's response.
 *
 * `allSchemas` guards the named branch: `IRSchema.name` doubles as the target of
 * a `$ref` and as the key a schema was reached through, so a name that is not
 * actually declared must not become a type reference.
 */
export const getResponseType = (
  schema: IRSchema | null,
  allSchemas: IRSchema[],
): string => {
  if (!schema) return 'void';

  if (isDeclaredSchema(schema, allSchemas)) return toPascalCase(schema.name!);

  if (schema.type === 'array' && schema.items) {
    const items = schema.items;
    const itemType = isDeclaredSchema(items, allSchemas)
      ? toPascalCase(items.name!)
      : getResponseType(items, allSchemas);
    return `Array<${itemType}>`;
  }

  switch (schema.type) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    default:
      return 'unknown';
  }
};
