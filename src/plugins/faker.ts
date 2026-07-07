import {
  type IR,
  type ApigConfig,
  type ApigPlugin,
  type PluginResult,
  banner,
} from '@models';
import { toPascalCase, getTypesImport, generateFakerFactory } from '../libs';

/**
 * Generates Faker.js factories for all OpenAPI schemas.
 *
 * Produces a `faker.ts` file with typed factory functions for test data generation.
 * Requires `@faker-js/faker` as a peer dependency.
 * @example faker()
 */
export const faker = (): ApigPlugin => ({
  name: 'faker',
  fileName: 'faker',
  scope: 'root',
  generate: (ir, config) => generateFaker(ir, config),
});

export const generateFaker = (ir: IR, config: ApigConfig): PluginResult => {
  const typesImport = getTypesImport(config);

  const usedTypes = ir.schemas
    .filter((s) => s.name && (s.type === 'object' || s.isEnum))
    .map((s) => `  ${toPascalCase(s.name!)}`)
    .join(',\n');

  const lines: string[] = [
    banner,
    '',
    "import { faker } from '@faker-js/faker';",
    'import type {',
    usedTypes,
    `} from '${typesImport}';`,
    '',
  ];

  for (const schema of ir.schemas) {
    const generated = generateFakerFactory(schema, ir.schemas);
    if (generated) {
      lines.push(generated);
      lines.push('');
    }
  }

  return {
    code: lines.join('\n'),
    exports: ir.schemas
      .filter((s) => s.name && s.type === 'object')
      .map((s) => `generate${toPascalCase(s.name!)}`),
    typeExports: [],
  };
};
