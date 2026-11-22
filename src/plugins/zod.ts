import {
  type IR,
  type ZvyappyConfig,
  type ZvyappyPlugin,
  type PluginResult,
  type ZodOptions,
  banner,
  DEFAULTS,
} from '@models';
import {
  toPascalCase,
  generateZodSchema,
  nativeEnumProps,
  getTypesImport,
  topoSortSchemas,
  findRecursiveSchemas,
} from '../libs';
import type { ZodOpts } from '../libs';

const DEFAULT_OPTS = DEFAULTS.PLUGINS.ZOD;

/**
 * Generates Zod validation schemas from OpenAPI schemas.
 *
 * Produces a `zod.ts` file with `z.object()` schemas and optional TypeScript type inference.
 * Requires `zod >= 3.0.0` as a peer dependency.
 * @example zod({ infer: true, validateResponse: true })
 */
export const zod = (options: ZodOptions = {}): ZvyappyPlugin => {
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
    schemaSuffix: opts.schemaSuffix,
    generate: (ir, config) => generateZod(ir, config, opts),
  };
};

export const generateZod = (
  ir: IR,
  config: ZvyappyConfig,
  opts: ZodOpts = { ...DEFAULT_OPTS },
): PluginResult => {
  const recursive = findRecursiveSchemas(ir.schemas);
  const lines: string[] = [banner, '', "import { z } from 'zod';"];

  // With the types owned by `typescript()`, a recursive schema still needs the
  // name it annotates itself with.
  if (!opts.withTypes && recursive.size > 0) {
    const names = [...recursive].map((n) => toPascalCase(n)).sort();
    lines.push(
      `import type { ${names.join(', ')} } from '${getTypesImport(config, 'root')}';`,
    );
    // validated with `z.nativeEnum`, so needed as values, not just types
    const enums = ir.schemas.flatMap((s) => [
      ...nativeEnumProps(s, ir.schemas, config, recursive).values(),
    ]);
    if (enums.length > 0)
      lines.push(
        `import { ${enums.sort().join(', ')} } from '${getTypesImport(config, 'root')}';`,
      );
  }

  lines.push('');

  for (const schema of topoSortSchemas(ir.schemas)) {
    const generated = generateZodSchema(
      schema,
      ir.schemas,
      config,
      opts,
      recursive,
    );
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
