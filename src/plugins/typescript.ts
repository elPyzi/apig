import {
  type ApigConfig,
  type PluginResult,
  type ApigPlugin,
  type TypescriptOptions,
  type IR,
  banner,
} from '@models';
import { toPascalCase, generateSchema } from '../libs';

/**
 * Generates TypeScript types from OpenAPI schemas.
 *
 * Produces a `types.ts` file with all models as `type` or `interface` declarations.
 * Automatically included when using validation plugins unless `withTypes` is disabled.
 * @example typescript()
 */
export const typescript = (_options: TypescriptOptions = {}): ApigPlugin => ({
  name: 'typescript',
  fileName: 'types',
  scope: 'root',
  generate: (ir, config) => generateTypes(ir, config),
});

export const generateTypes = (ir: IR, config: ApigConfig): PluginResult => {
  const lines: string[] = [banner, ''];

  for (const schema of ir.schemas) {
    const generated = generateSchema(schema, config);
    if (generated) {
      lines.push(generated);
      lines.push('');
    }
  }

  return {
    code: lines.join('\n'),
    exports: [],
    typeExports: ir.schemas
      .filter((s) => s.name)
      .map((s) => toPascalCase(s.name!)),
  };
};
