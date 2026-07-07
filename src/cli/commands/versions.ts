import { resolve } from 'path';
import type { Command } from 'commander';
import { createJiti } from 'jiti';
import { toMessage } from '@libs/error';
import { logger } from '@libs/logger';
import { VersionStorage, formatDate } from '@services/versioning';
import { checkout } from '@services/writer';
import type { ApigConfig, Versioning } from '@models';

const loadConfig = async (
  configPath: string,
): Promise<ApigConfig | undefined> => {
  try {
    const jiti = createJiti(import.meta.url);
    const mod = (await jiti.import(resolve(process.cwd(), configPath))) as {
      default: ApigConfig | ApigConfig[];
    };
    const configs = Array.isArray(mod.default) ? mod.default : [mod.default];
    return configs[0];
  } catch {
    return undefined;
  }
};

const loadVersioningConfig = async (
  configPath: string,
): Promise<Versioning | undefined> => {
  return (await loadConfig(configPath))?.versioning;
};

const getStorage = (storagePath: string) =>
  new VersionStorage(resolve(process.cwd(), storagePath));

export const registerVersionsCommands = (program: Command): void => {
  program
    .command('versions')
    .description('List all stored snapshots')
    .option('-c, --config <path>', 'Path to config file', 'apig.config.ts')
    .option('-s, --storage <path>', 'Storage directory (overrides config)')
    .action(async (options) => {
      const versioning = await loadVersioningConfig(options.config);
      const storagePath =
        options.storage ?? versioning?.storage ?? '.apig/versions';
      const pinVersions = versioning?.pinVersions ?? [];
      const storage = getStorage(storagePath);
      const list = storage.listWithMeta(pinVersions);
      if (list.length === 0) {
        logger.info('No snapshots found.');
        return;
      }
      console.log(
        `${'ALIAS'.padEnd(12)}  ${'SNAPSHOT ID'.padEnd(24)}  CREATED`,
      );
      console.log(`${'-'.repeat(12)}  ${'-'.repeat(24)}  ${'-'.repeat(16)}`);
      for (const { id, alias, createdAt, pinned } of list) {
        const pin = pinned ? '  📌' : '';
        console.log(
          `${alias.padEnd(12)}  ${id.padEnd(24)}  ${createdAt}${pin}`,
        );
      }
    });

  const versionCmd = program
    .command('version')
    .description('Snapshot commands');

  versionCmd
    .command('checkout <snapshotId>')
    .description('Regenerate code from a saved snapshot')
    .option('-c, --config <path>', 'Path to config file', 'apig.config.ts')
    .option('--dry-run', 'Preview without writing files')
    .action(async (rawId: string, options) => {
      const config = await loadConfig(options.config);
      if (!config) {
        logger.error(`Config not found: ${options.config}`);
        process.exit(1);
      }
      const versioning = config.versioning ?? {};
      const storagePath = versioning.storage ?? '.apig/versions';
      const storage = getStorage(storagePath);
      const stripped = rawId.includes(' - ') ? rawId.split(' - ')[0]! : rawId;
      try {
        const snapshotId = storage.resolveId(stripped);
        await checkout(snapshotId, config, { dryRun: options.dryRun ?? false });
      } catch (err: unknown) {
        logger.error(toMessage(err));
        process.exit(1);
      }
    });

  versionCmd
    .command('show <snapshotId>')
    .description('Show details of a specific snapshot')
    .option('-c, --config <path>', 'Path to config file', 'apig.config.ts')
    .option('-s, --storage <path>', 'Storage directory (overrides config)')
    .action(async (rawId: string, options) => {
      const versioning = await loadVersioningConfig(options.config);
      const storagePath =
        options.storage ?? versioning?.storage ?? '.apig/versions';
      const storage = getStorage(storagePath);

      const stripped = rawId.includes(' - ') ? rawId.split(' - ')[0]! : rawId;
      const snapshotId = storage.resolveId(stripped);
      try {
        const meta = storage.loadMetadata(snapshotId);
        const hasSpec = storage.loadSpec(snapshotId) !== null;
        const createdAt = formatDate(new Date(meta.createdAt));
        const pinned = versioning?.pinVersions?.includes(snapshotId) ?? false;

        console.log(
          `Alias:        ${meta.alias}${pinned ? '  📌 pinned' : ''}`,
        );
        console.log(`Snapshot:     ${meta.snapshotId}`);
        console.log(`API Version:  ${meta.apiVersion}`);
        console.log(`Generation:   ${meta.generation}`);
        console.log(`Created:      ${createdAt}`);
        console.log(`Comment:      ${meta.comment}`);
        console.log(`Spec Saved:   ${hasSpec}`);
      } catch (err: unknown) {
        logger.error(toMessage(err));
        process.exit(1);
      }
    });
};
