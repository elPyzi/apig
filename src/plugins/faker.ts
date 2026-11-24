import {
  type IR,
  type ZvyappyConfig,
  type ZvyappyPlugin,
  type PluginResult,
  banner,
} from '@models';
import {
  toPascalCase,
  getTypesImport,
  generateFakerFactory,
  findRecursiveSchemas,
} from '../libs';

/**
 * Generates Faker.js factories for all OpenAPI schemas.
 *
 * Produces a `faker.ts` file with typed factory functions for test data generation.
 * Requires `@faker-js/faker` as a peer dependency.
 * @example faker()
 */
export const faker = (): ZvyappyPlugin => ({
  name: 'faker',
  fileName: 'faker',
  scope: 'root',
  generate: (ir, config) => generateFaker(ir, config),
});

export const generateFaker = (ir: IR, config: ZvyappyConfig): PluginResult => {
  const typesImport = getTypesImport(config, 'root');

  const usedTypes = ir.schemas
    .filter((s) => s.name)
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

  const recursive = findRecursiveSchemas(ir.schemas);
  for (const schema of ir.schemas) {
    const generated = generateFakerFactory(schema, ir.schemas, recursive);
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
