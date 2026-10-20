import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { logger } from '@libs/logger';
import { type Formatter, FORMATTERS } from '@models';

const FORMATTER_CONFIGS: Record<string, string[]> = {
  [FORMATTERS.PRETTIER]: [
    '.prettierrc',
    '.prettierrc.json',
    '.prettierrc.js',
    '.prettierrc.cjs',
    '.prettierrc.mjs',
    '.prettierrc.ts',
    'prettier.config.js',
    'prettier.config.cjs',
    'prettier.config.mjs',
    'prettier.config.ts',
  ],
  [FORMATTERS.BIOME]: ['biome.json', 'biome.jsonc'],
  [FORMATTERS.OXFMT]: ['oxfmt.toml'],
};

const hasFormatterConfig = (formatter: string): boolean => {
  const configs = FORMATTER_CONFIGS[formatter] ?? [];
  return configs.some((file) => existsSync(join(process.cwd(), file)));
};

export const formatFiles = (outputPath: string, formatter: Formatter): void => {
  if (!formatter || formatter === FORMATTERS.NONE) return;

  if (!hasFormatterConfig(formatter)) {
    logger.warn(
      `No ${formatter} config found — add a config file or formatting may use unexpected defaults`,
    );
    return;
  }

  // `--no-install` on purpose: without it npx downloads a missing formatter from
  // the registry mid-generation, which is a surprising thing for a code
  // generator to do and hangs outright when offline. Failing instead reaches the
  // catch below, which says what to install.
  try {
    switch (formatter) {
      case FORMATTERS.PRETTIER:
        execSync(`npx --no-install prettier --write "${outputPath}/**/*.ts"`, {
          stdio: 'pipe',
        });
        break;
      case FORMATTERS.BIOME:
        execSync(`npx --no-install biome format --write "${outputPath}"`, {
          stdio: 'pipe',
        });
        break;
      case FORMATTERS.OXFMT:
        execSync(`npx --no-install oxfmt "${outputPath}"`, { stdio: 'pipe' });
        break;
    }
    logger.plugin('writer', 'Formatting done');
  } catch {
    logger.warn(`Formatter ${formatter} failed — make sure it is installed`);
    logger.warn(`Run: bun add -d ${formatter}`);
  }
};
