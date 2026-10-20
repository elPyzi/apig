import {
  type ApigConfig,
  type ApigPlugin,
  type ExtraFile,
  type PluginResult,
  type SwrOptions,
  type SwrFramework,
  type IR,
  banner,
  HTTP_METHODS,
  DEFAULTS,
} from '@models';
import {
  toPascalCase,
  getTypesImport,
  getParamTypeNames,
  getFunctionName,
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
  const style = options.queryKeysStyle ?? DEFAULTS.PLUGINS.SWR.queryKeysStyle;
  const hookGenerationStrategies =
    options.hookGenerationStrategies ??
    DEFAULTS.PLUGINS.SWR.hookGenerationStrategies;
  const framework = options.framework ?? DEFAULTS.PLUGINS.SWR.framework;

  const plugin: ApigPlugin = {
    name: 'swr',
    fileName: 'swr',
    scope: 'operations',
    generate: (ir, config, ctx) =>
      generateSwr(
        ir,
        config,
        ctx?.requestsImportPath ?? './requests',
        ctx?.queryKeysImportPath ?? './swr-keys',
        style,
        hookGenerationStrategies,
        ctx?.configImportPath ?? './config',
        ctx?.customErrorImportPath,
        framework,
      ),
  };

  if (style === 'object') {
    plugin.generateRootFiles = (ir, config): ExtraFile[] => [
      { fileName: 'swr-keys.ts', code: generateSwrKeysFile(config, ir) },
    ];
  }

  return plugin;
};

export { generateSwrKeysFile };

export const generateSwr = (
  ir: IR,
  config: ApigConfig,
  requestsImportPath = './requests',
  swrKeysImportPath = './swr-keys',
  style: 'functions' | 'object' = 'functions',
  hookGenerationStrategies: Record<
    string,
    { query?: boolean; mutation?: boolean }
  > = {},
  configImportPath = './config',
  customErrorImportPath?: string,
  framework: SwrFramework = DEFAULTS.PLUGINS.SWR.framework,
): PluginResult => {
  const typesImport = getTypesImport(config, 'operations');
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

  const requestsFunctions = ir.operations.map((op) =>
    getFunctionName(op, config),
  );
  const requestsErrorTypes = errCfg.enabled
    ? ir.operations
        .filter((op) => op.errors?.length)
        .map((op) => `${toPascalCase(op.id)}Errors`)
    : [];

  const usedTypes = new Set<string>();
  for (const op of ir.operations) {
    for (const name of getParamTypeNames(op, ir.schemas)) usedTypes.add(name);
    if (op.response?.name) usedTypes.add(toPascalCase(op.response.name));
    if (op.response?.items?.name)
      usedTypes.add(toPascalCase(op.response.items.name));
    if (op.body?.schema.name) usedTypes.add(toPascalCase(op.body.schema.name));
  }

  const lines: string[] = [banner, ''];

  if (framework === 'vue') {
    if (queryOps.length > 0) {
      lines.push(`import useSWRV from 'swrv';`);
      lines.push(`import type { IConfig } from 'swrv';`);
    }
    if (mutationOps.length > 0) lines.push(`import { mutate } from 'swrv';`);
  } else {
    if (mutationOps.length > 0) {
      lines.push("import useSWRMutation from 'swr/mutation';");
      lines.push(
        "import type { SWRMutationConfiguration } from 'swr/mutation';",
      );
    }
    if (queryOps.length > 0) {
      lines.push(`import useSWR, { type SWRConfiguration } from 'swr';`);
    }
  }

  if (requestsFunctions.length > 0) {
    lines.push(
      `import { ${requestsFunctions.join(', ')} } from '${requestsImportPath}';`,
    );
  }
  if (requestsErrorTypes.length > 0) {
    lines.push(
      `import type { ${requestsErrorTypes.join(', ')} } from '${requestsImportPath}';`,
    );
  }

  if (style === 'object' && queryOps.length > 0) {
    lines.push(`import { swrKeys } from '${swrKeysImportPath}';`);
  }

  if (usedTypes.size > 0) {
    lines.push(
      `import type { ${[...usedTypes].join(', ')} } from '${typesImport}';`,
    );
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
    ]
      .filter(Boolean)
      .join(', ');
    lines.push(`import type { ${named} } from '${configImportPath}';`);
  }

  lines.push('');

  const exports: string[] = [];

  for (const op of queryOps) {
    if (style === 'functions') {
      lines.push(generateSwrKeyFn(config, op));
      lines.push('');
      exports.push(`${getFunctionName(op, config)}SwrKey`);
    }
    lines.push(
      generateSwrQueryHook(
        op,
        ir.schemas,
        style,
        config,
        errorHandling,
        rawResponse,
        errCfg.className,
        framework,
      ),
    );
    lines.push('');
    exports.push(`use${toPascalCase(op.id)}`);
  }

  for (const op of mutationOps) {
    lines.push(
      generateSwrMutationHook(
        op,
        ir.schemas,
        config,
        errorHandling,
        rawResponse,
        errCfg.className,
        framework,
      ),
    );
    lines.push('');
    exports.push(`use${toPascalCase(op.id)}Mutation`);
  }

  return {
    code: lines.join('\n'),
    exports,
    typeExports: [],
  };
};
