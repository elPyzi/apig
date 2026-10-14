import type { IRSchema } from '@models';

const INLINE_TYPES = new Set(['string', 'number', 'boolean', 'null']);

/**
 * Whether this schema stands for a declared schema rather than an inline shape.
 *
 * `IRSchema.name` carries two different things: the target of a `$ref`, and the
 * property key a schema was reached through. A `$ref` arrives carrying nothing
 * but a name, so anything holding its own content — properties, items, an enum,
 * or even just a primitive type — is an inline shape. Without that distinction a
 * property called `status` is emitted as a reference to an unrelated component
 * that happens to be called `status`, which silently validates the wrong thing.
 *
 * Every validation plugin shares this: they used to disagree, and each
 * disagreement was a bug.
 */
export const isSchemaReference = (
  schema: IRSchema,
  allSchemas: IRSchema[],
): boolean =>
  Boolean(schema.name) &&
  allSchemas.some((s) => s.name === schema.name) &&
  !schema.properties &&
  !schema.schemas &&
  !schema.items &&
  !schema.prefixItems &&
  !schema.isEnum &&
  !INLINE_TYPES.has(schema.type);

const collectRefs = (
  schema: IRSchema,
  allSchemas: IRSchema[],
  out: Set<string>,
  isRoot = false,
): void => {
  if (!isRoot && isSchemaReference(schema, allSchemas)) {
    out.add(schema.name!);
    return;
  }
  schema.properties?.forEach(
    (p) => p.schema && collectRefs(p.schema, allSchemas, out),
  );
  schema.schemas?.forEach((s) => collectRefs(s, allSchemas, out));
  if (schema.items) collectRefs(schema.items, allSchemas, out);
  schema.prefixItems?.forEach((s) => collectRefs(s, allSchemas, out));
};

/** Names this schema will reference once generated, excluding itself. */
export const schemaRefsOf = (
  schema: IRSchema,
  allSchemas: IRSchema[],
): Set<string> => {
  const out = new Set<string>();
  collectRefs(schema, allSchemas, out, true);
  return out;
};

const memoRefs = (schemas: IRSchema[]) => {
  const cache = new Map<string, Set<string>>();
  return (schema: IRSchema): Set<string> => {
    const key = schema.name!;
    let refs = cache.get(key);
    if (!refs) {
      refs = schemaRefsOf(schema, schemas);
      cache.set(key, refs);
    }
    return refs;
  };
};

/**
 * Schemas ordered so that each is declared before the schemas referencing it.
 *
 * These are `const` bindings, so a reference reached before its declaration is a
 * temporal dead zone error rather than something hoisting rescues.
 */
export const topoSortSchemas = (schemas: IRSchema[]): IRSchema[] => {
  const named = new Map(schemas.filter((s) => s.name).map((s) => [s.name!, s]));
  const refsOf = memoRefs(schemas);
  const sorted: IRSchema[] = [];
  const visited = new Set<string>();

  for (const start of schemas) {
    if (!start.name || visited.has(start.name)) continue;

    // iterative DFS with an explicit stack — a deep schema graph would blow the
    // call stack otherwise
    const stack: Array<{ schema: IRSchema; refs: string[]; idx: number }> = [];
    const inStack = new Set<string>();

    stack.push({ schema: start, refs: [...refsOf(start)], idx: 0 });
    inStack.add(start.name);

    while (stack.length > 0) {
      const frame = stack[stack.length - 1]!;
      const name = frame.schema.name!;
      let pushed = false;

      while (frame.idx < frame.refs.length) {
        const ref = frame.refs[frame.idx++]!;
        if (ref === name || visited.has(ref) || inStack.has(ref)) continue;
        const dep = named.get(ref);
        if (!dep?.name) continue;
        inStack.add(dep.name);
        stack.push({ schema: dep, refs: [...refsOf(dep)], idx: 0 });
        pushed = true;
        break;
      }

      if (!pushed) {
        stack.pop();
        if (!visited.has(name)) {
          visited.add(name);
          sorted.push(frame.schema);
        }
        inStack.delete(name);
      }
    }
  }

  for (const s of schemas) if (!s.name) sorted.push(s);
  return sorted;
};

/**
 * Schemas that can reach themselves through references.
 *
 * No ordering can satisfy a cycle, so these have to be referenced lazily — and
 * a lazy schema gives the type checker nothing to infer from, so it also needs
 * an explicit type annotation.
 */
export const findRecursiveSchemas = (schemas: IRSchema[]): Set<string> => {
  const named = new Map(schemas.filter((s) => s.name).map((s) => [s.name!, s]));
  const refsOf = memoRefs(schemas);
  const recursive = new Set<string>();

  for (const start of schemas) {
    if (!start.name) continue;

    const seen = new Set<string>();
    const queue = [...refsOf(start)];

    while (queue.length > 0) {
      const ref = queue.shift()!;
      if (ref === start.name) {
        recursive.add(start.name);
        break;
      }
      if (seen.has(ref)) continue;
      seen.add(ref);
      const dep = named.get(ref);
      if (dep) queue.push(...refsOf(dep));
    }
  }

  return recursive;
};
