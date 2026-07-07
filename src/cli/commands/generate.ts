import { resolve } from 'path';
import { existsSync, watch as fsWatch } from 'fs';
import type { Command } from 'commander';
import { createJiti } from 'jiti';
import { toMessage } from '@libs/error';
import { ConfigValidationError } from '@libs/validation/validate-config';

import { write } from '@services/writer';
import { logger } from '@libs/logger';

const loadConfig = async (configPath: string) => {
  const jiti = createJiti(import.meta.url);
  const mod = (await jiti.import(resolve(process.cwd(), configPath))) as {
    default: unknown;
  };
  const configs = mod.default;
  return Array.isArray(configs) ? configs : [configs];
};

export const registerGenerateCommand = (program: Command): void => {
  program
    .command('generate')
    .alias('g')
    .description('Generate code from OpenAPI spec')
    .option('-c, --config <path>', 'Path to config file', 'apig.config.ts')
    .option(
      '-d, --dry-run',
      'Show what would be generated without writing files',
    )
    .option('-w, --watch', 'Watch spec/config for changes and regenerate')
    .action(async (options) => {
      const run = async () => {
        try {
          const configs = await loadConfig(options.config);
          for (const config of configs) {
            if (config.name) logger.title(config.name);
            await write(config, { dryRun: options.dryRun ?? false });
          }
        } catch (error: unknown) {
          if (error instanceof ConfigValidationError) {
            logger.validationError('Generation failed: Config validation failed', error.validationErrors, error.docLinks);
          } else {
            logger.error(`Generation failed: ${toMessage(error)}`);
          }
          if (!options.watch) process.exit(1);
        }
      };

      await run();

      if (options.watch) {
        if (options.dryRun) {
          logger.info(
            'Watch + dry-run: showing what would change on each reload',
          );
        }

        const watched = new Set<string>();
        let debounceTimer: ReturnType<typeof setTimeout> | null = null;

        const onChange = (label: string) => {
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(async () => {
            logger.divider();
            logger.info(`${label} changed — regenerating...`);
            await run();
          }, 300);
        };

        const configPath = resolve(process.cwd(), options.config);
        if (existsSync(configPath) && !watched.has(configPath)) {
          fsWatch(configPath, () => onChange(`Config`));
          watched.add(configPath);
          logger.info(`Watching: ${options.config}`);
        }

        try {
          const configs = await loadConfig(options.config);
          for (const config of configs) {
            const input = config.input as string;
            if (!input.startsWith('http')) {
              const specPath = resolve(process.cwd(), input);
              if (existsSync(specPath) && !watched.has(specPath)) {
                fsWatch(specPath, () => onChange(`Spec (${input})`));
                watched.add(specPath);
                logger.info(`Watching: ${input}`);
              }
            } else {
              logger.info(
                `Remote spec (${input}) — watch not supported for URLs`,
              );
            }
          }
        } catch (_) {
          // spec load failed during watch setup — ignore, will retry on change
        }

        logger.divider();
        logger.success('Watching for changes. Press Ctrl+C to stop.');
        process.stdin.resume();
      }
    });
};
