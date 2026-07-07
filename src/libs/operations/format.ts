import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { logger } from '@libs/logger';
import { type Formatter, FORMATTERS } from '@models';

const FORMATTER_CONFIGS: Record<string, string[]> = {
  [FORMATTERS.PRETTIER]: ['.prettierrc', '.prettierrc.json', '.prettierrc.js', '.prettierrc.cjs', '.prettierrc.mjs', '.prettierrc.ts', 'prettier.config.js', 'prettier.config.cjs', 'prettier.config.mjs', 'prettier.config.ts'],
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
    logger.warn(`No ${formatter} config found — add a config file or formatting may use unexpected defaults`);
    return;
  }

  try {
    switch (formatter) {
      case FORMATTERS.PRETTIER:
        execSync(`npx prettier --write "${outputPath}/**/*.ts"`, {
          stdio: 'pipe',
        });
        break;
      case FORMATTERS.BIOME:
        execSync(`npx biome format --write "${outputPath}"`, {
          stdio: 'pipe',
        });
        break;
      case FORMATTERS.OXFMT:
        execSync(`npx oxfmt "${outputPath}"`, { stdio: 'pipe' });
        break;
    }
    logger.plugin('writer', 'Formatting done');
  } catch (_) {
    logger.warn(`Formatter ${formatter} failed — make sure it is installed`);
    logger.warn(`Run: bun add -d ${formatter}`);
  }
};
