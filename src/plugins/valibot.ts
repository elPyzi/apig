import {
  type IR,
  type ApigConfig,
  type ApigPlugin,
  type PluginResult,
  type ValibotOptions,
  banner,
  DEFAULTS,
} from '@models';
import {
  toPascalCase,
  generateValibotSchema,
  getTypesImport,
  topoSortSchemas,
  findRecursiveSchemas,
} from '../libs';
import type { ValibotOpts } from '../libs';

const DEFAULT_OPTS = DEFAULTS.PLUGINS.VALIBOT;

/**
 * Generates Valibot validation schemas from OpenAPI schemas.
 *
 * Produces a `valibot.ts` file with `v.object()` schemas.
 * Requires `valibot >= 1.0.0` as a peer dependency.
 * @example valibot({ withTypes: true })
 */
export const valibot = (options: ValibotOptions = {}): ApigPlugin => {
  const opts: ValibotOpts = {
    withTypes: options.withTypes ?? DEFAULT_OPTS.withTypes,
    schemaSuffix: options.schemaSuffix ?? DEFAULT_OPTS.schemaSuffix,
  };

  return {
    name: 'valibot',
    fileName: 'valibot',
    scope: 'root',
    withTypes: opts.withTypes,
    schemaSuffix: opts.schemaSuffix,
    generate: (ir, config) => generateValibot(ir, config, opts),
  };
};

export const generateValibot = (
  ir: IR,
  config: ApigConfig,
  opts: ValibotOpts = { ...DEFAULT_OPTS },
): PluginResult => {
  const recursive = findRecursiveSchemas(ir.schemas);
  const lines: string[] = [banner, '', "import * as v from 'valibot';"];

  // With the types owned by `typescript()`, a recursive schema still needs the
  // name it annotates itself with.
  if (!opts.withTypes && recursive.size > 0) {
    const names = [...recursive].map((n) => toPascalCase(n)).sort();
    lines.push(
      `import type { ${names.join(', ')} } from '${getTypesImport(config, 'root')}';`,
    );
  }

  lines.push('');

  for (const schema of topoSortSchemas(ir.schemas)) {
    const generated = generateValibotSchema(
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
