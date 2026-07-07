import { join, resolve, relative, dirname } from 'path';
import { mkdirSync } from 'fs';

import type { ApigConfig, ApigPlugin, PluginResult } from '@models';
import type { IR, IROperation } from '@models';
import { applyNaming } from '@libs/string';
import type { WriteFn } from '@services/writer/write-fn';

const VALIDATION_NAMES = new Set(['zod', 'valibot', 'yup']);

const resolveCustomErrorPath = (userPath: string, generatedFileDir: string): string => {
  const abs = resolve(process.cwd(), userPath);
  const rel = relative(generatedFileDir, abs).replace(/\.ts$/, '');
  return rel.startsWith('.') ? rel : `./${rel}`;
};

export const buildTagMap = (
  operations: IROperation[],
): Map<string, IROperation[]> => {
  const tagMap = new Map<string, IROperation[]>();
  for (const op of operations) {
    const tag = op.tag ?? 'default';
    if (!tagMap.has(tag)) tagMap.set(tag, []);
    tagMap.get(tag)!.push(op);
  }
  return tagMap;
};

export const writeRootPlugins = (
  ir: IR,
  config: ApigConfig,
  outputPath: string,
  plugins: ApigPlugin[],
  results: Record<string, PluginResult>,
  writeFn: WriteFn,
): void => {
  const suppressTypescript = plugins.some(
    (p) => VALIDATION_NAMES.has(p.name) && (p.withTypes ?? true),
  );

  for (const plugin of plugins) {
    if (plugin.scope !== 'root') continue;
    if (plugin.name === 'typescript' && suppressTypescript) continue;

    const result = plugin.generate(ir, config);
    results[plugin.name] = result;
    writeFn(`${plugin.fileName}.ts`, result.code, outputPath);
  }
};

export const writeOpPlugins = (
  ir: IR,
  config: ApigConfig,
  dir: string,
  fileBaseName: string,
  plugins: ApigPlugin[],
  results: Record<string, PluginResult>,
  resultKeySuffix: string,
  logPrefix: string,
  queryKeysImportPath: string,
  writeFn: WriteFn,
): void => {
  const sdkPlugin = plugins.find((p) => p.name === 'sdk');
  const sdkFileName = sdkPlugin?.fileName ?? 'sdk';

  for (const plugin of plugins) {
    if (plugin.scope !== 'operations') continue;

    const sdkImportPath = `./${fileBaseName}.${sdkFileName}`;
    const configImportPath = queryKeysImportPath?.replace('query-keys', 'config') ?? './config';
    const eh = config.errorHandling;
    const customErrorImportPath =
      eh && typeof eh === 'object'
        ? resolveCustomErrorPath(eh.path, dir)
        : undefined;
    const clientImportPath =
      config.httpClient?.path
        ? resolveCustomErrorPath(config.httpClient.path, dir)
        : undefined;
    const result = plugin.generate(ir, config, {
      sdkImportPath,
      queryKeysImportPath,
      configImportPath,
      customErrorImportPath,
      clientImportPath,
    });
    const filename = `${fileBaseName}.${plugin.fileName}.ts`;

    writeFn(filename, result.code, dir);
    results[`${plugin.name}_${resultKeySuffix}`] = result;
  }
};

export const writePluginRootFiles = (
  ir: IR,
  config: ApigConfig,
  outputPath: string,
  plugins: ApigPlugin[],
  writeFn: WriteFn,
): void => {
  for (const plugin of plugins) {
    if (!plugin.generateRootFiles) continue;
    for (const file of plugin.generateRootFiles(ir, config)) {
      writeFn(file.fileName, file.code, outputPath);
    }
  }
};

export const writeAll = (
  ir: IR,
  config: ApigConfig,
  outputPath: string,
  plugins: ApigPlugin[],
  results: Record<string, PluginResult>,
  writeFn: WriteFn,
): void => {
  writeRootPlugins(ir, config, outputPath, plugins, results, writeFn);

  for (const plugin of plugins) {
    if (plugin.scope !== 'operations') continue;
    const eh = config.errorHandling;
    const customErrorImportPath =
      eh && typeof eh === 'object'
        ? resolveCustomErrorPath(eh.path, outputPath)
        : undefined;
    const clientImportPath =
      config.httpClient?.path
        ? resolveCustomErrorPath(config.httpClient.path, outputPath)
        : undefined;
    const result = plugin.generate(ir, config, {
      sdkImportPath: './sdk',
      queryKeysImportPath: './query-keys',
      configImportPath: './config',
      customErrorImportPath,
      clientImportPath,
    });
    results[plugin.name] = result;
    writeFn(`${plugin.fileName}.ts`, result.code, outputPath);
  }

  writePluginRootFiles(ir, config, outputPath, plugins, writeFn);
};

export const writeByTags = (
  ir: IR,
  config: ApigConfig,
  outputPath: string,
  plugins: ApigPlugin[],
  results: Record<string, PluginResult>,
  tagMap: Map<string, IROperation[]>,
  writeFn: WriteFn,
  dryRun = false,
): void => {
  const naming = config.fileNaming ?? 'kebab-case';

  for (const [tag, operations] of tagMap) {
    const tagName = applyNaming(tag, naming);
    const tagDir = join(outputPath, tagName);
    if (!dryRun) mkdirSync(tagDir, { recursive: true });

    const tagIR: IR = { operations, schemas: ir.schemas };
    writeOpPlugins(
      tagIR,
      config,
      tagDir,
      tagName,
      plugins,
      results,
      tag,
      tagName,
      '../query-keys',
      writeFn,
    );
  }
};

export const writeByEndpoints = (
  ir: IR,
  config: ApigConfig,
  outputPath: string,
  plugins: ApigPlugin[],
  results: Record<string, PluginResult>,
  writeFn: WriteFn,
  dryRun = false,
): Map<string, IROperation[]> => {
  const naming = config.fileNaming ?? 'kebab-case';
  const tagMap = buildTagMap(ir.operations);

  for (const [tag, operations] of tagMap) {
    const tagDirName = applyNaming(tag, naming);
    const tagDir = join(outputPath, tagDirName);
    if (!dryRun) mkdirSync(tagDir, { recursive: true });

    for (const operation of operations) {
      const opDirName = applyNaming(operation.id, naming);
      const opDir = join(tagDir, opDirName);
      if (!dryRun) mkdirSync(opDir, { recursive: true });

      const opIR: IR = { operations: [operation], schemas: ir.schemas };
      writeOpPlugins(
        opIR,
        config,
        opDir,
        opDirName,
        plugins,
        results,
        operation.id,
        `${tagDirName}/${opDirName}`,
        '../../query-keys',
        writeFn,
      );
    }
  }

  return tagMap;
};

export const writeByOperations = (
  ir: IR,
  config: ApigConfig,
  outputPath: string,
  plugins: ApigPlugin[],
  results: Record<string, PluginResult>,
  writeFn: WriteFn,
  dryRun = false,
): void => {
  const naming = config.fileNaming ?? 'kebab-case';

  for (const operation of ir.operations) {
    const opDirName = applyNaming(operation.id, naming);
    const opDir = join(outputPath, opDirName);
    if (!dryRun) mkdirSync(opDir, { recursive: true });

    const opIR: IR = { operations: [operation], schemas: ir.schemas };
    writeOpPlugins(
      opIR,
      config,
      opDir,
      opDirName,
      plugins,
      results,
      operation.id,
      opDirName,
      '../query-keys',
      writeFn,
    );
  }
};
