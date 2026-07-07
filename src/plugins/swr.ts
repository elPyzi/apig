import {
  type ApigConfig,
  type ApigPlugin,
  type ExtraFile,
  type PluginResult,
  type SwrOptions,
  type IR,
  banner,
  HTTP_METHODS,
} from '@models';
import {
  toCamelCase,
  toPascalCase,
  getTypesImport,
  getErrorConfig,
  generateSwrKeyFn,
  generateSwrQueryHook,
  generateSwrMutationHook,
  generateSwrKeysFile,
} from '../libs';

/**
 * Generates SWR hooks from OpenAPI operations.
 *
 * Produces a `swr.ts` file with `useSWR` query hooks and `useSWRMutation` mutation hooks.
 * Requires `swr >= 2.0.0` as a peer dependency.
 * @example swr({ queryKeysStyle: "object" })
 */
export const swr = (options: SwrOptions = {}): ApigPlugin => {
  const style = options.queryKeysStyle ?? 'functions';
  const hookGenerationStrategies = options.hookGenerationStrategies ?? {};

  const plugin: ApigPlugin = {
    name: 'swr',
    fileName: 'swr',
    scope: 'operations',
    generate: (ir, config, ctx) =>
      generateSwr(
        ir,
        config,
        ctx?.sdkImportPath ?? './sdk',
        ctx?.queryKeysImportPath ?? './swr-keys',
        style,
        hookGenerationStrategies,
        ctx?.configImportPath ?? './config',
        ctx?.customErrorImportPath,
      ),
  };

  if (style === 'object') {
    plugin.generateRootFiles = (ir): ExtraFile[] => [
      { fileName: 'swr-keys.ts', code: generateSwrKeysFile(ir) },
    ];
  }

  return plugin;
};

export { generateSwrKeysFile };

export const generateSwr = (
  ir: IR,
  config: ApigConfig,
  sdkImportPath = './sdk',
  swrKeysImportPath = './swr-keys',
  style: 'functions' | 'object' = 'functions',
  hookGenerationStrategies: Record<string, { query?: boolean; mutation?: boolean }> = {},
  configImportPath = './config',
  customErrorImportPath?: string,
): PluginResult => {
  const typesImport = getTypesImport(config);
  const errCfg = getErrorConfig(config);
  const errorHandling = errCfg.enabled;
  const rawResponse = config.rawResponse === true;

  const queryOps = ir.operations.filter((op) => {
    const s = hookGenerationStrategies[op.id];
    return s ? (s.query ?? false) : op.method === HTTP_METHODS.GET;
  });
  const mutationOps = ir.operations.filter((op) => {
    const s = hookGenerationStrategies[op.id];
    return s ? (s.mutation ?? false) : op.method !== HTTP_METHODS.GET;
  });

  const sdkFunctions = ir.operations.map((op) => toCamelCase(op.id));
  const sdkErrorTypes = errCfg.enabled
    ? ir.operations.filter((op) => op.errors?.length).map((op) => `${toPascalCase(op.id)}Errors`)
    : [];

  const usedTypes = new Set<string>();
  for (const op of ir.operations) {
    if (op.response?.name) usedTypes.add(toPascalCase(op.response.name));
    if (op.response?.items?.name) usedTypes.add(toPascalCase(op.response.items.name));
    if (op.body?.schema.name) usedTypes.add(toPascalCase(op.body.schema.name));
  }

  const lines: string[] = [banner, ''];

  if (mutationOps.length > 0) {
    lines.push("import useSWRMutation from 'swr/mutation';");
    lines.push("import type { SWRMutationConfiguration } from 'swr/mutation';");
  }
  if (queryOps.length > 0) {
    lines.push(`import useSWR, { type SWRConfiguration } from 'swr';`);
  }

  if (sdkFunctions.length > 0) {
    lines.push(`import { ${sdkFunctions.join(', ')} } from '${sdkImportPath}';`);
  }
  if (sdkErrorTypes.length > 0) {
    lines.push(`import type { ${sdkErrorTypes.join(', ')} } from '${sdkImportPath}';`);
  }

  if (style === 'object' && queryOps.length > 0) {
    lines.push(`import { swrKeys } from '${swrKeysImportPath}';`);
  }

  if (usedTypes.size > 0) {
    lines.push(`import type { ${[...usedTypes].join(', ')} } from '${typesImport}';`);
  }

  if (errCfg.enabled && errCfg.importPath) {
    const errorPath = customErrorImportPath ?? errCfg.importPath;
    lines.push(`import type { ${errCfg.className} } from '${errorPath}';`);
    if (config.rawResponse)
      lines.push(`import type { ApigResponse } from '${configImportPath}';`);
  } else if (errCfg.enabled || config.rawResponse) {
    const named = [
      errCfg.enabled ? errCfg.className : '',
      config.rawResponse ? 'ApigResponse' : '',
    ].filter(Boolean).join(', ');
    lines.push(`import type { ${named} } from '${configImportPath}';`);
  }

  lines.push('');

  const exports: string[] = [];

  for (const op of queryOps) {
    if (style === 'functions') {
      lines.push(generateSwrKeyFn(op));
      lines.push('');
      exports.push(`${toCamelCase(op.id)}SwrKey`);
    }
    lines.push(generateSwrQueryHook(op, style, errorHandling, rawResponse, errCfg.className));
    lines.push('');
    exports.push(`use${toPascalCase(op.id)}`);
  }

  for (const op of mutationOps) {
    lines.push(generateSwrMutationHook(op, errorHandling, rawResponse, errCfg.className));
    lines.push('');
    exports.push(`use${toPascalCase(op.id)}Mutation`);
  }

  return {
    code: lines.join('\n'),
    exports,
    typeExports: [],
  };
};
