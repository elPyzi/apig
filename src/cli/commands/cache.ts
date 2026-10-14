import type { Command } from 'commander';
import { relative } from 'path';

import { clearCache, inspectCache, type CacheSummary } from '@services/cache';
import { logger } from '@libs/logger';

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * The cache lives under the directory apig was run from, so the path is worth
 * printing — running from elsewhere reads and writes a different one.
 */
const describe = ({ dir, entries, bytes }: CacheSummary): string => {
  const where = relative(process.cwd(), dir) || dir;
  const plural = entries === 1 ? 'entry' : 'entries';
  return `${entries} ${plural}, ${formatSize(bytes)} in ${where}`;
};

export const registerCacheCommands = (program: Command): void => {
  const cacheCmd = program
    .command('cache')
    .description('Inspect or clear the parsed-spec cache');

  cacheCmd
    .command('clear')
    .description('Remove every cached spec so the next run parses again')
    .action(() => {
      const summary = clearCache();

      if (summary.entries === 0) {
        logger.plain('Cache is already empty.');
        return;
      }

      logger.success(`Cache cleared — ${describe(summary)}`);
    });

  cacheCmd
    .command('status')
    .description('Show what is currently cached')
    .action(() => {
      const summary = inspectCache();

      if (summary.entries === 0) {
        logger.plain('Cache is empty.');
        return;
      }

      logger.plain(describe(summary));
    });
};
