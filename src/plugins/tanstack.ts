import {
  type ApigConfig,
  type ApigPlugin,
  type ExtraFile,
  type PluginResult,
  type TanstackQueryOptions,
  type IR,
  banner,
  HTTP_METHODS,
} from '@models';
import {
  toCamelCase,
  toPascalCase,
  getTypesImport,
  getErrorConfig,
  buildTanstackImports,
  generateQueryKeyFn,
  generateQuery,
  generateInfiniteQuery,
  generateSuspenseQuery,
  generateTanstackMutation,
  generateQueryKeysFile,
} from '../libs';

const DEFAULT_OPTS: Required<TanstackQueryOptions> = {
  query: true,
  mutation: true,
  infinite: false,
  suspense: false,
  queryKeysStyle: 'functions',
  hookGenerationStrategies: {},
};

/**
 * Generates TanStack Query hooks from OpenAPI operations.
 *
 * Produces a `tanstack.ts` file with `useQuery`, `useMutation`, `useInfiniteQuery`,
 * and `useSuspenseQuery` hooks, plus `queryOptions` helpers.
 * Requires `@tanstack/react-query >= 5.0.0` as a peer dependency.
 * @example tanstackQuery({ infinite: true, suspense: true })
 */
export const tanstackQuery = (
  options: TanstackQueryOptions = {},
): ApigPlugin => {
  const opts: Required<TanstackQueryOptions> = {
    query: options.query ?? true,
    mutation: options.mutation ?? true,
    infinite: options.infinite ?? false,
    suspense: options.suspense ?? false,
    queryKeysStyle: options.queryKeysStyle ?? 'functions',
    hookGenerationStrategies: options.hookGenerationStrategies ?? {},
  };

  const plugin: ApigPlugin = {
    name: 'tanstack-query',
    fileName: 'tanstack',
    scope: 'operations',
    generate: (ir, config, ctx) =>
      generateTanstack(
        ir,
        config,
        ctx?.sdkImportPath ?? './sdk',
        ctx?.queryKeysImportPath ?? './query-keys',
        opts,
        ctx?.configImportPath ?? './config',
        ctx?.customErrorImportPath,
      ),
  };

  if (opts.queryKeysStyle === 'object') {
    plugin.generateRootFiles = (ir): ExtraFile[] => [
      { fileName: 'query-keys.ts', code: generateQueryKeysFile(ir) },
    ];
  }

  return plugin;
};

export { generateQueryKeysFile };

export const generateTanstack = (
  ir: IR,
  config: ApigConfig,
  sdkImportPath = './sdk',
  queryKeysImportPath = './query-keys',
  opts: Required<TanstackQueryOptions> = DEFAULT_OPTS,
  configImportPath = './config',
  customErrorImportPath?: string,
): PluginResult => {
  const typesImport = getTypesImport(config);
  const style = opts.queryKeysStyle;

  const sdkFunctions: string[] = [];
  const usedTypes = new Set<string>();
  const sdkErrorTypes: string[] = [];

  const errCfg = getErrorConfig(config);
  const errorHandling = errCfg.enabled;
  const rawResponse = config.rawResponse === true;

  for (const op of ir.operations) {
    sdkFunctions.push(toCamelCase(op.id));
    if (op.response?.name) usedTypes.add(toPascalCase(op.response.name));
    if (op.response?.items?.name)
      usedTypes.add(toPascalCase(op.response.items.name));
    if (op.body?.schema.name) usedTypes.add(toPascalCase(op.body.schema.name));
    if (errorHandling && op.errors?.length) {
      sdkErrorTypes.push(`${toPascalCase(op.id)}Errors`);
    }
  }

  // Determine which hook types are actually generated (accounting for strategies)
  const usedHooks = { query: false, mutation: false, infinite: false, suspense: false };
  for (const op of ir.operations) {
    const isGet = op.method === HTTP_METHODS.GET;
    const strategy = opts.hookGenerationStrategies?.[op.id];
    if (strategy ? (strategy.query ?? false) : (isGet && opts.query)) usedHooks.query = true;
    if (strategy ? (strategy.mutation ?? false) : (!isGet && opts.mutation)) usedHooks.mutation = true;
    if (strategy ? (strategy.infinite ?? false) : (isGet && opts.infinite)) usedHooks.infinite = true;
    if (strategy ? (strategy.suspense ?? false) : (isGet && opts.suspense && opts.query)) usedHooks.suspense = true;
  }

  const lines: string[] = [
    banner,
    '',
    buildTanstackImports(usedHooks),
    `import { ${sdkFunctions.join(', ')} } from '${sdkImportPath}';`,
  ];

  if (sdkErrorTypes.length > 0)
    lines.push(`import type { ${sdkErrorTypes.join(', ')} } from '${sdkImportPath}';`);
  if (style === 'object')
    lines.push(`import { queryKeys } from '${queryKeysImportPath}';`);
  if (usedTypes.size > 0)
    lines.push(
      `import type { ${[...usedTypes].join(', ')} } from '${typesImport}';`,
    );

  if (errCfg.enabled && errCfg.importPath) {
    const errorPath = customErrorImportPath ?? errCfg.importPath;
    lines.push(`import type { ${errCfg.className} } from '${errorPath}';`);
    if (config.rawResponse)
      lines.push(`import type { ApigResponse } from '${configImportPath}';`);
  } else if (errCfg.enabled || config.rawResponse || usedHooks.query || usedHooks.infinite || usedHooks.suspense) {
    const named = [
      (errCfg.enabled || usedHooks.query || usedHooks.infinite || usedHooks.suspense) ? errCfg.className : '',
      config.rawResponse ? 'ApigResponse' : '',
    ].filter(Boolean).join(', ');
    lines.push(`import type { ${named} } from '${configImportPath}';`);
  }

  lines.push('');

  const exports: string[] = [];

  for (const op of ir.operations) {
    const isGet = op.method === HTTP_METHODS.GET;
    const strategy = opts.hookGenerationStrategies?.[op.id];
    const genQuery = strategy ? (strategy.query ?? false) : (isGet && opts.query);
    const genMutation = strategy ? (strategy.mutation ?? false) : (!isGet && opts.mutation);
    const genInfinite = strategy ? (strategy.infinite ?? false) : (isGet && opts.infinite);
    const genSuspense = strategy ? (strategy.suspense ?? false) : (isGet && opts.suspense && opts.query);

    const name = toCamelCase(op.id);
    const pascalName = toPascalCase(op.id);

    if (genQuery) {
      if (style === 'functions') {
        lines.push(generateQueryKeyFn(op));
        lines.push('');
      }
      lines.push(generateQuery(op, style, errorHandling, rawResponse, errCfg.className));
      lines.push('');
      if (style === 'functions') exports.push(`${name}QueryKey`);
      exports.push(`${name}QueryOptions`, `use${pascalName}Query`);
    }

    if (genInfinite) {
      lines.push(generateInfiniteQuery(op, style));
      lines.push('');
      exports.push(`useInfinity${pascalName}Query`);
    }

    if (genSuspense) {
      lines.push(generateSuspenseQuery(op));
      lines.push('');
      exports.push(`useSuspense${pascalName}Query`);
    }

    if (genMutation) {
      lines.push(generateTanstackMutation(op, errorHandling, rawResponse, errCfg.className));
      lines.push('');
      exports.push(`use${pascalName}Mutation`);
    }
  }

  return {
    code: lines.join('\n'),
    exports,
    typeExports: [],
  };
};
