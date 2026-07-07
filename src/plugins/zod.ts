import {
  type IR,
  type IRSchema,
  type ApigConfig,
  type ApigPlugin,
  type PluginResult,
  type ZodOptions,
  banner,
} from '@models';
import { toPascalCase, generateZodSchema } from '../libs';
import type { ZodOpts } from '../libs';

const collectRefs = (schema: IRSchema, out: Set<string>): void => {
  if (schema.name && !schema.properties && !schema.schemas && !schema.items) {
    out.add(schema.name);
    return;
  }
  schema.properties?.forEach((p) => p.schema && collectRefs(p.schema, out));
  schema.schemas?.forEach((s) => collectRefs(s, out));
  if (schema.items) collectRefs(schema.items, out);
};

const topoSort = (schemas: IRSchema[]): IRSchema[] => {
  const named = new Map(schemas.filter((s) => s.name).map((s) => [s.name!, s]));
  const sorted: IRSchema[] = [];
  const visited = new Set<string>();

  for (const start of schemas) {
    if (!start.name || visited.has(start.name)) continue;

    // iterative DFS with explicit stack
    const stack: Array<{ schema: IRSchema; refs: string[]; idx: number }> = [];
    const inStack = new Set<string>();

    stack.push({ schema: start, refs: [...collectRefsOf(start)], idx: 0 });
    inStack.add(start.name);

    while (stack.length > 0) {
      const frame = stack[stack.length - 1]!;
      const sName = frame.schema.name!;
      let pushed = false;
      while (frame.idx < frame.refs.length) {
        const ref = frame.refs[frame.idx++]!;
        if (ref === sName || visited.has(ref) || inStack.has(ref)) continue;
        const dep = named.get(ref);
        if (!dep || !dep.name) continue;
        inStack.add(dep.name);
        stack.push({ schema: dep, refs: [...collectRefsOf(dep)], idx: 0 });
        pushed = true;
        break;
      }
      if (!pushed) {
        stack.pop();
        if (!visited.has(sName)) {
          visited.add(sName);
          sorted.push(frame.schema);
        }
        inStack.delete(sName);
      }
    }
  }

  for (const s of schemas) if (!s.name) sorted.push(s);
  return sorted;
};

const collectRefsOf = (schema: IRSchema): Set<string> => {
  const out = new Set<string>();
  collectRefs(schema, out);
  return out;
};

const DEFAULT_OPTS: ZodOpts = {
  infer: true,
  input: false,
  output: false,
  validateResponse: false,
  withTypes: true,
  schemaSuffix: 'Schema',
};

/**
 * Generates Zod validation schemas from OpenAPI schemas.
 *
 * Produces a `zod.ts` file with `z.object()` schemas and optional TypeScript type inference.
 * Requires `zod >= 3.0.0` as a peer dependency.
 * @example zod({ infer: true, validateResponse: true })
 */
export const zod = (options: ZodOptions = {}): ApigPlugin => {
  const opts: ZodOpts = {
    infer: options.infer ?? DEFAULT_OPTS.infer,
    input: options.input ?? DEFAULT_OPTS.input,
    output: options.output ?? DEFAULT_OPTS.output,
    validateResponse: options.validateResponse ?? DEFAULT_OPTS.validateResponse,
    withTypes: options.withTypes ?? DEFAULT_OPTS.withTypes,
    schemaSuffix: options.schemaSuffix ?? DEFAULT_OPTS.schemaSuffix,
  };

  return {
    name: 'zod',
    fileName: 'zod',
    scope: 'root',
    withTypes: opts.withTypes,
    generate: (ir, config) => generateZod(ir, config, opts),
  };
};

export const generateZod = (
  ir: IR,
  config: ApigConfig,
  opts: ZodOpts = DEFAULT_OPTS,
): PluginResult => {
  const lines: string[] = [banner, '', "import { z } from 'zod';", ''];

  for (const schema of topoSort(ir.schemas)) {
    const generated = generateZodSchema(schema, ir.schemas, config, opts);
    if (generated) {
      lines.push(generated);
      lines.push('');
    }
  }

  return {
    code: lines.join('\n'),
    exports: ir.schemas
      .filter((s) => s.name)
      .map((s) => `${toPascalCase(s.name!)}${opts.schemaSuffix}`),
    typeExports: opts.withTypes
      ? ir.schemas.filter((s) => s.name).map((s) => toPascalCase(s.name!))
      : [],
  };
};
