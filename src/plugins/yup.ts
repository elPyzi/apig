import {
  type IR,
  type ApigConfig,
  type ApigPlugin,
  type PluginResult,
  type YupOptions,
  banner,
} from '@models';
import { toPascalCase, generateYupSchema } from '../libs';
import type { YupOpts } from '../libs';

const DEFAULT_OPTS: YupOpts = {
  withTypes: true,
  schemaSuffix: 'Schema',
};

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
    generate: (ir, config) => generateYup(ir, config, opts),
  };
};

export const generateYup = (
  ir: IR,
  config: ApigConfig,
  opts: YupOpts = DEFAULT_OPTS,
): PluginResult => {
  const lines: string[] = [banner, '', "import * as yup from 'yup';", ''];

  for (const schema of ir.schemas) {
    const generated = generateYupSchema(schema, ir.schemas, config, opts);
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
