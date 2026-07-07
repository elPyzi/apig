import { execSync } from 'child_process';
import { resolve } from 'path';

import type { ApigConfig, GenerationStats, IR, PluginResult } from '@models';
import { GROUP_BY, FORMATTERS, LOG_LEVELS } from '@models';
import { load } from '@services/parser';
import { saveSnapshot, VersionStorage, formatDate } from '@services/versioning';
import { validateConfig } from '@libs/validation';
import { logger } from '@libs/logger';
import { filterOperations } from '@libs/operations/filter';
import { renameOperations } from '@libs/operations/rename';
import { formatFiles } from '@libs/operations/format';
import { generateEndpoints } from '@libs/operations/endpoints';
import { applyNaming } from '@libs/string';

import {
  makeWriteFn,
  resolvePlugins,
  resolveOutputPath,
  cleanOutput,
} from '@services/writer/write-fn';
import { resetBaseUrlWarning } from '@services/codegen';

import {
  buildTagMap,
  writeAll,
  writeByTags,
  writeByEndpoints,
  writeByOperations,
  writeRootPlugins,
  writePluginRootFiles,
} from '@services/writer/groups';

import {
  buildIndexNone,
  buildIndexTags,
  buildIndexEndpoints,
  buildIndexOperations,
} from '@services/writer/index-builder';

export interface WriteOptions {
  dryRun?: boolean;
}

const generateFromIR = (
  ir: IR,
  config: ApigConfig,
  outputPath: string,
  dryRun: boolean,
  stats: GenerationStats,
): void => {
  const writeFn = makeWriteFn(stats, dryRun);
  const plugins = resolvePlugins(config);
  const results: Record<string, PluginResult> = {};
  const groupBy = config.groupBy ?? GROUP_BY.NONE;

  logger.stage('Running plugins...');
  logger.br();

  let indexContent: string;

  switch (groupBy) {
    case GROUP_BY.NONE: {
      writeAll(ir, config, outputPath, plugins, results, writeFn);
      indexContent = buildIndexNone(plugins, results);
      break;
    }
    case GROUP_BY.TAGS: {
      writeRootPlugins(ir, config, outputPath, plugins, results, writeFn);
      const tagMap = buildTagMap(ir.operations);
      writeByTags(ir, config, outputPath, plugins, results, tagMap, writeFn, dryRun);
      writePluginRootFiles(ir, config, outputPath, plugins, writeFn);
      indexContent = buildIndexTags(plugins, results, tagMap, config);
      break;
    }
    case GROUP_BY.ENDPOINTS: {
      writeRootPlugins(ir, config, outputPath, plugins, results, writeFn);
      writeByEndpoints(ir, config, outputPath, plugins, results, writeFn, dryRun);
      writePluginRootFiles(ir, config, outputPath, plugins, writeFn);
      indexContent = buildIndexEndpoints(ir, plugins, results, config);
      break;
    }
    case GROUP_BY.OPERATIONS: {
      writeRootPlugins(ir, config, outputPath, plugins, results, writeFn);
      writeByOperations(ir, config, outputPath, plugins, results, writeFn, dryRun);
      writePluginRootFiles(ir, config, outputPath, plugins, writeFn);
      indexContent = buildIndexOperations(ir, plugins, results, config);
      break;
    }
  }

  if (config.index !== false) {
    writeFn('index.ts', indexContent, outputPath);
  }

  if (config.endpointsMap) {
    writeFn('endpoints.ts', generateEndpoints(ir), outputPath);
  }

  logger.stage('Writing files...');
  logger.success('Files written');
  logger.br();
};

export const write = async (
  config: ApigConfig,
  { dryRun = false }: WriteOptions = {},
): Promise<void> => {
  validateConfig(config);
  resetBaseUrlWarning();

  const cliLevel = config.cliLogging?.level ?? LOG_LEVELS.MINIMAL;
  logger.setLevel(cliLevel);

  const stats: GenerationStats = {
    operations: 0,
    schemas: 0,
    createdFiles: 0,
    updatedFiles: 0,
    deletedFiles: 0,
    startedAt: Date.now(),
    endedAt: 0,
  };

  if (dryRun) {
    logger.stage('Dry run — no files will be written');
  }

  const LOAD_TIMEOUT_MS = 120_000;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const { ir: rawIr, spec } = await Promise.race([
    load(config),
    new Promise<never>((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error(`Specification loading timed out after ${LOAD_TIMEOUT_MS / 1000}s — check your input URL or file`)),
        LOAD_TIMEOUT_MS,
      );
    }),
  ]).finally(() => clearTimeout(timeoutId));

  const ir = {
    ...rawIr,
    operations: renameOperations(filterOperations(rawIr.operations, config), config),
  };

  stats.operations = ir.operations.length;
  stats.schemas = ir.schemas.length;

  if (typeof config.input === 'string') {
    logger.section('Source', config.input);
  }
  logger.success('Specification loaded');
  logger.success('IR built');
  logger.br();

  const outputPath = resolveOutputPath(config);
  if (!dryRun) cleanOutput(outputPath, config);

  generateFromIR(ir, config, outputPath, dryRun, stats);

  if (!dryRun) {
    if (config.formatter && config.formatter !== FORMATTERS.NONE) {
      formatFiles(outputPath, config.formatter);
    }

    if (config.versioning?.enabled) {
      logger.detail('Saving snapshot...');
      const folder = saveSnapshot({ ir, spec, config });
      logger.section('Snapshot', folder);
      logger.success('Snapshot saved');
      logger.br();
    }

    if (config.hooks?.afterAllFilesWrite) {
      logger.hook(config.hooks.afterAllFilesWrite);
      try {
        execSync(config.hooks.afterAllFilesWrite, { stdio: 'inherit' });
      } catch (_) {
        logger.error(`Hook failed: ${config.hooks.afterAllFilesWrite}`);
      }
    }
  }

  stats.endedAt = Date.now();
  logger.summary(stats);
};

export const checkout = async (
  snapshotIdOrAlias: string,
  config: ApigConfig,
  { dryRun = false }: WriteOptions = {},
): Promise<void> => {
  validateConfig(config);
  resetBaseUrlWarning();

  const cliLevel = config.cliLogging?.level ?? LOG_LEVELS.MINIMAL;
  logger.setLevel(cliLevel);

  const versioning = config.versioning ?? {};
  const storagePath = resolve(versioning.storage ?? '.apig/versions');
  const storage = new VersionStorage(storagePath);

  const snapshotId = storage.resolveId(snapshotIdOrAlias);
  const meta = storage.loadMetadata(snapshotId);
  const ir = storage.loadIR(snapshotId);

  logger.section('Checkout', `${meta.alias}  (${snapshotId})`);
  logger.section('Created', formatDate(new Date(meta.createdAt)));
  logger.br();

  const stats: GenerationStats = {
    operations: ir.operations.length,
    schemas: ir.schemas.length,
    createdFiles: 0,
    updatedFiles: 0,
    deletedFiles: 0,
    startedAt: Date.now(),
    endedAt: 0,
  };

  const outputPath = resolveOutputPath(config);
  if (!dryRun) cleanOutput(outputPath, config);

  generateFromIR(ir, config, outputPath, dryRun, stats);

  if (!dryRun) {
    if (config.formatter && config.formatter !== FORMATTERS.NONE) {
      formatFiles(outputPath, config.formatter);
    }

    if (config.hooks?.afterAllFilesWrite) {
      logger.hook(config.hooks.afterAllFilesWrite);
      try {
        execSync(config.hooks.afterAllFilesWrite, { stdio: 'inherit' });
      } catch (_) {
        logger.error(`Hook failed: ${config.hooks.afterAllFilesWrite}`);
      }
    }
  }

  stats.endedAt = Date.now();
  logger.summary(stats);
};
