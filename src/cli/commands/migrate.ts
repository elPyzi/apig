import { existsSync, rmSync, writeFileSync } from 'fs';
import { basename, join, resolve } from 'path';
import type { Command } from 'commander';
import { logger } from '@libs/logger';
import { toMessage } from '@libs/error';
import {
  loadHeyApiConfig,
  loadKubbConfig,
  loadOrvalConfig,
  migrateHeyApi,
  migrateKubb,
  migrateOrval,
  renderConfig,
  type MigratedProject,
} from '@services/migrate';

type Generator = 'orval' | 'kubb' | 'hey-api';

const GENERATORS: Generator[] = ['orval', 'kubb', 'hey-api'];

/** The config file each generator looks for when no path is given. */
const CONFIG_NAMES: Record<Generator, string> = {
  orval: 'orval.config',
  kubb: 'kubb.config',
  'hey-api': 'openapi-ts.config',
};

const isGenerator = (value: string): value is Generator =>
  (GENERATORS as string[]).includes(value);

const EXTENSIONS = ['ts', 'mts', 'cts', 'js', 'mjs', 'cjs'];

type MigrationOptions = {
  clean?: boolean;
  target?: string;
};

const findConfig = (generator: Generator, target?: string): string | null => {
  if (target) return existsSync(resolve(target)) ? resolve(target) : null;
  for (const ext of EXTENSIONS) {
    const path = resolve(`${CONFIG_NAMES[generator]}.${ext}`);
    if (existsSync(path)) return path;
  }
  return null;
};

const migrate = async (
  generator: Generator,
  configPath: string,
): Promise<MigratedProject[]> => {
  if (generator === 'orval')
    return migrateOrval(await loadOrvalConfig(configPath), configPath);
  if (generator === 'hey-api')
    return migrateHeyApi(await loadHeyApiConfig(configPath), configPath);
  return migrateKubb(await loadKubbConfig(configPath));
};

export const registerMigrateCommand = (program: Command): void => {
  program
    .command('migrate <generator>')
    .alias('m')
    .description(
      `Create zvyappy.config.ts from another generator's config (${GENERATORS.join(', ')})`,
    )
    .option('-c, --clean', 'Delete the source config after migrating')
    .option('-t, --target <path>', 'Path to the source config')
    .action(async (generator: string, options: MigrationOptions) => {
      if (!isGenerator(generator)) {
        logger.error(
          `Unknown generator "${generator}". Available: ${GENERATORS.join(', ')}`,
        );
        process.exit(1);
      }

      const configPath = findConfig(generator, options.target);
      if (!configPath) {
        logger.error(
          options.target
            ? `Config not found: ${options.target}`
            : `No ${CONFIG_NAMES[generator]}.{${EXTENSIONS.join(',')}} in the current directory — pass its path with --target`,
        );
        process.exit(1);
      }

      const zvyappyConfigPath = join(process.cwd(), 'zvyappy.config.ts');
      if (existsSync(zvyappyConfigPath)) {
        logger.error('zvyappy.config.ts already exists');
        process.exit(1);
      }

      let projects: MigratedProject[];
      try {
        projects = await migrate(generator, configPath);
      } catch (error: unknown) {
        logger.error(
          `Could not read ${basename(configPath)}: ${toMessage(error)}`,
        );
        process.exit(1);
      }

      if (projects.length === 0) {
        logger.error(`${basename(configPath)} defines no projects`);
        process.exit(1);
      }

      writeFileSync(
        zvyappyConfigPath,
        renderConfig(projects, basename(configPath)),
        'utf-8',
      );
      logger.success(
        `Created zvyappy.config.ts from ${basename(configPath)} (${projects.length} project${projects.length === 1 ? '' : 's'})`,
      );

      // the same note on a dozen projects reads better once, with the projects listed
      const notes = new Map<string, string[]>();
      for (const project of projects) {
        for (const note of project.notes) {
          const owners = notes.get(note) ?? [];
          if (project.name) owners.push(project.name);
          notes.set(note, owners);
        }
      }
      if (notes.size) {
        logger.plain('');
        logger.plain(
          `⚠ ${notes.size} thing${notes.size === 1 ? '' : 's'} to review (also marked TODO(migrate) in the config):`,
        );
        for (const [note, owners] of notes) {
          const scope =
            owners.length === 0 || owners.length === projects.length
              ? ''
              : `[${owners.join(', ')}] `;
          logger.plain(`  - ${scope}${note}`);
        }
      }

      if (options.clean) {
        rmSync(configPath);
        logger.success(`Deleted ${basename(configPath)}`);
      }

      logger.plain('');
      logger.plain('Review zvyappy.config.ts and run: zvyappy generate');
    });
};
