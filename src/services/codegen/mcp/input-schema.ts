import type { IROperation, IRProperty, IRSchema } from '@models';
import { generateZodValue } from '@services/codegen/zod/generate-zod-schema';

const VALID_IDENTIFIER = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

const quoteKey = (name: string): string =>
  VALID_IDENTIFIER.test(name) ? name : `'${name}'`;

const optional = (expr: string, required: boolean): string =>
  required ? expr : `${expr}.optional()`;

const zodFor = (
  schema: IRSchema | undefined,
  allSchemas: IRSchema[],
  suffix: string,
): string =>
  schema ? generateZodValue(schema, allSchemas, suffix) : 'z.unknown()';

const objectOf = (
  props: IRProperty[],
  allSchemas: IRSchema[],
  suffix: string,
): string => {
  const fields = props
    .map(
      (p) =>
        `${quoteKey(p.name)}: ${optional(zodFor(p.schema, allSchemas, suffix), p.required)}`,
    )
    .join(', ');
  return `z.object({ ${fields} })`;
};

/**
 * Builds the raw shape the MCP requests expects for `inputSchema` —
 * `Record<string, ZodType>`, not a `z.object(...)`.
 *
 * The shape mirrors the generated request function's parameter list one to one, so
 * the tool handler can forward its arguments positionally without remapping.
 */
export const buildInputSchema = (
  operation: IROperation,
  allSchemas: IRSchema[],
  suffix: string,
): string => {
  const entries: string[] = [];

  for (const param of operation.params.path) {
    entries.push(
      `${quoteKey(param.name)}: ${zodFor(param.schema, allSchemas, suffix)}`,
    );
  }

  if (operation.params.query.length > 0) {
    const required = operation.params.query.some((p) => p.required);
    entries.push(
      `params: ${optional(objectOf(operation.params.query, allSchemas, suffix), required)}`,
    );
  }

  if (operation.body && operation.body.contentType !== 'multipart') {
    entries.push(
      `body: ${optional(zodFor(operation.body.schema, allSchemas, suffix), operation.body.required)}`,
    );
  }

  if (operation.params.header.length > 0) {
    const required = operation.params.header.some((p) => p.required);
    entries.push(
      `headers: ${optional(objectOf(operation.params.header, allSchemas, suffix), required)}`,
    );
  }

  return entries.length > 0 ? `{ ${entries.join(', ')} }` : '{}';
};

/** Names of declared schemas the generated tool references, so they can be imported. */
export const collectSchemaRefs = (
  schema: IRSchema | undefined,
  allSchemas: IRSchema[],
  found: Set<string> = new Set(),
): Set<string> => {
  if (!schema) return found;

  if (schema.name && allSchemas.some((s) => s.name === schema.name)) {
    found.add(schema.name);
    // a reference stops the walk — the referenced schema declares its own body
    return found;
  }

  collectSchemaRefs(schema.items, allSchemas, found);
  for (const nested of schema.schemas ?? [])
    collectSchemaRefs(nested, allSchemas, found);
  for (const member of schema.prefixItems ?? [])
    collectSchemaRefs(member, allSchemas, found);
  for (const prop of schema.properties ?? [])
    collectSchemaRefs(prop.schema, allSchemas, found);

  return found;
};

/** Every declared schema referenced by an operation's input. */
export const operationSchemaRefs = (
  operation: IROperation,
  allSchemas: IRSchema[],
  found: Set<string> = new Set(),
): Set<string> => {
  const params = [
    ...operation.params.path,
    ...operation.params.query,
    ...operation.params.header,
  ];
  for (const param of params)
    collectSchemaRefs(param.schema, allSchemas, found);
  if (operation.body?.contentType !== 'multipart') {
    collectSchemaRefs(operation.body?.schema, allSchemas, found);
  }
  return found;
};
