import { resolve } from 'path';
import type { Command } from 'commander';
import { createJiti } from 'jiti';
import { toMessage } from '@libs/error';

import { load } from '@services/parser';
import { logger } from '@libs/logger';
import type { ApigConfig } from '@models';

const loadConfig = async (configPath: string): Promise<ApigConfig[]> => {
  const jiti = createJiti(import.meta.url);

  const mod = (await jiti.import(resolve(process.cwd(), configPath))) as {
    default: ApigConfig | ApigConfig[];
  };

  return Array.isArray(mod.default) ? mod.default : [mod.default];
};

export const registerInfoCommand = (program: Command): void => {
  program
    .command('info')
    .alias('i')
    .description('Show spec statistics without generating files')
    .option('-c, --config <path>', 'Path to config file', 'apig.config.ts')
    .action(async (options) => {
      try {
        const configs = await loadConfig(options.config);

        for (const config of configs) {
          const { ir, spec } = await load(config);

          const title = spec.info?.title ?? 'Unknown';
          const version = spec.info?.version ?? '—';
          const outputPath =
            typeof config.output === 'string'
              ? config.output
              : (config.output?.path ?? '—');
          const plugins = (config.plugins ?? ['typescript', 'sdk']).map((p) =>
            typeof p === 'string' ? p : (p.name ?? 'custom'),
          );

          const byMethod: Record<string, number> = {};
          const byTag: Record<string, number> = {};

          for (const op of ir.operations) {
            byMethod[op.method] = (byMethod[op.method] ?? 0) + 1;
            byTag[op.tag] = (byTag[op.tag] ?? 0) + 1;
          }

          const divider = '─'.repeat(48);

          console.log('');
          console.log(divider);
          console.log(`  API:       ${title} v${version}`);
          console.log(`  Input:     ${config.input}`);
          console.log(`  Output:    ${outputPath}`);
          console.log(`  Group by:  ${config.groupBy ?? 'none'}`);
          console.log(divider);
          console.log(`  Operations: ${ir.operations.length}`);
          for (const [method, count] of Object.entries(byMethod).sort()) {
            console.log(`    ${method.padEnd(7)} ${count}`);
          }
          console.log(`  Schemas:    ${ir.schemas.length}`);
          console.log(`  Tags:       ${Object.keys(byTag).join(', ') || '—'}`);
          console.log(divider);
          console.log(`  Plugins:   ${plugins.join(', ')}`);
          console.log(divider);
          console.log('');
        }
      } catch (error: unknown) {
        logger.error(`Failed to load spec: ${toMessage(error)}`);
        process.exit(1);
      }
    });
};
