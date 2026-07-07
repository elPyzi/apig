import { resolve } from 'path';
import { rmSync, mkdirSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';

import type { ApigConfig, ApigPlugin, GenerationStats } from '@models';
import { logger } from '@libs/logger';

import { typescript, sdk, faker, zod, tanstackQuery, msw } from '@plugins';

export type WriteFn = (
  filename: string,
  content: string,
  outputDir: string,
) => void;

const DEFAULT_PLUGINS: ApigPlugin[] = [
  typescript(),
  sdk(),
  faker(),
  zod(),
  tanstackQuery(),
  msw(),
];

export const resolvePlugins = (config: ApigConfig): ApigPlugin[] =>
  config.plugins ?? DEFAULT_PLUGINS;

const DEFAULT_OUTPUT = '.apig/generated';

export const resolveOutputPath = (config: ApigConfig): string => {
  if (!config.output) return resolve(DEFAULT_OUTPUT);
  return typeof config.output === 'string'
    ? resolve(config.output)
    : resolve(config.output.path);
};

export const cleanOutput = (outputPath: string, config: ApigConfig): void => {
  const shouldClean =
    !config.output || typeof config.output === 'string' ? true : (config.output.clean ?? true);

  if (shouldClean && existsSync(outputPath)) {
    rmSync(outputPath, { recursive: true });
  }

  mkdirSync(outputPath, { recursive: true });
};

export const makeWriteFn = (
  stats: GenerationStats,
  dryRun: boolean,
): WriteFn => {
  return (filename: string, content: string, outputDir: string): void => {
    if (dryRun) {
      logger.detail(
        `Would write: ${join(outputDir, filename).replace(process.cwd() + '/', '')}`,
      );
      stats.createdFiles++;
      return;
    }
    const fullPath = join(outputDir, filename);
    const isUpdate = existsSync(fullPath);
    writeFileSync(fullPath, content, 'utf-8');
    if (isUpdate) {
      stats.updatedFiles++;
    } else {
      stats.createdFiles++;
    }
    logger.detail(`  ${isUpdate ? 'Updated' : 'Created'}: ${filename}`);
  };
};
