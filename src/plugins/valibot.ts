import {
  type IR,
  type ApigConfig,
  type ApigPlugin,
  type PluginResult,
  type ValibotOptions,
  banner,
} from '@models';
import { toPascalCase, generateValibotSchema } from '../libs';
import type { ValibotOpts } from '../libs';

const DEFAULT_OPTS: ValibotOpts = {
  withTypes: true,
  schemaSuffix: 'Schema',
};

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
    generate: (ir, config) => generateValibot(ir, config, opts),
  };
};

export const generateValibot = (
  ir: IR,
  config: ApigConfig,
  opts: ValibotOpts = DEFAULT_OPTS,
): PluginResult => {
  const lines: string[] = [banner, '', "import * as v from 'valibot';", ''];

  for (const schema of ir.schemas) {
    const generated = generateValibotSchema(schema, ir.schemas, config, opts);
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
