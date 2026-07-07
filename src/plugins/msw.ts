import {
  type IR,
  type ApigConfig,
  type ApigPlugin,
  type PluginResult,
  banner,
} from '@models';
import {
  toPascalCase,
  logger,
  hasFakerPlugin,
  generateMswHandler,
  getMswUsedGenerators,
  getMswNeedsFaker,
} from '../libs';

/**
 * Generates Mock Service Worker handlers for all OpenAPI operations.
 *
 * Produces a `msw.ts` file with `http` handlers returning Faker-generated data.
 * Requires `msw >= 2.0.0` as a peer dependency.
 * @example msw()
 */
export const msw = (): ApigPlugin => ({
  name: 'msw',
  fileName: 'msw',
  scope: 'root',
  generate: (ir, config) => generateMsw(ir, config),
});

export const generateMsw = (ir: IR, config: ApigConfig): PluginResult => {
  logger.plugin('msw', 'Generating handlers...');

  if (!hasFakerPlugin(config)) {
    logger.error('msw plugin requires faker plugin — add "faker" to plugins');
    throw new Error('msw plugin requires faker plugin');
  }

  const usedGenerators = getMswUsedGenerators(ir.operations);
  const needsFaker = getMswNeedsFaker(ir.operations);

  const lines: string[] = [
    banner,
    '',
    "import { http, HttpResponse } from 'msw';",
  ];

  if (needsFaker) lines.push("import { faker } from '@faker-js/faker';");

  if (usedGenerators.size > 0) {
    lines.push(
      `import { ${[...usedGenerators].join(', ')} } from '@/plugins/faker';`,
    );
  }

  lines.push('');
  lines.push('export const handlers = [');

  for (const operation of ir.operations) {
    lines.push(generateMswHandler(operation, config));
  }

  lines.push('];');

  logger.plugin('msw', `Done — ${ir.operations.length} handlers`);

  return {
    code: lines.join('\n'),
    exports: ['handlers'],
    typeExports: [],
  };
};
