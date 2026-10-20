import {
  type IR,
  type ApigConfig,
  type ApigPlugin,
  type PluginResult,
  type YupOptions,
  banner,
  DEFAULTS,
} from '@models';
import {
  toPascalCase,
  generateYupSchema,
  getTypesImport,
  topoSortSchemas,
  findRecursiveSchemas,
} from '../libs';
import type { YupOpts } from '../libs';

const DEFAULT_OPTS = DEFAULTS.PLUGINS.YUP;

/**
 * Generates Yup validation schemas from OpenAPI schemas.
 *
 * Produces a `yup.ts` file with `yup.object()` schemas.
 * Requires `yup >= 1.0.0` as a peer dependency.
 * @example yup({ withTypes: true })
 */
export const yup = (options: YupOptions = {}): ApigPlugin => {
  const opts: YupOpts = {
    withTypes: options.withTypes ?? DEFAULT_OPTS.withTypes,
    schemaSuffix: options.schemaSuffix ?? DEFAULT_OPTS.schemaSuffix,
  };

  return {
    name: 'yup',
    fileName: 'yup',
    scope: 'root',
    withTypes: opts.withTypes,
    schemaSuffix: opts.schemaSuffix,
    generate: (ir, config) => generateYup(ir, config, opts),
  };
};

export const generateYup = (
  ir: IR,
  config: ApigConfig,
  opts: YupOpts = { ...DEFAULT_OPTS },
): PluginResult => {
  const recursive = findRecursiveSchemas(ir.schemas);
  const lines: string[] = [banner, '', "import * as yup from 'yup';"];

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
    const generated = generateYupSchema(
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
