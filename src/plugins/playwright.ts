import {
  GROUP_BY,
  banner,
  type ApigConfig,
  type ApigPlugin,
  type IR,
  type PluginContext,
  type PlaywrightOptions,
  type PluginResult,
} from '@models';
import {
  logger,
  toPascalCase,
  hasFakerPlugin,
  getTypesImport,
  getErrorConfig,
  getRootPluginImport,
  needsQueryHelper,
  needsParseErrorHelper,
  buildApigConfigFile,
  APIG_CONFIG_FILE,
  buildNames,
  getMethodName,
  getFakerSamples,
  hasQueryParams,
  hasHeaderParams,
  hasMultipartBody,
  generatePlaywrightMethod,
  generatePlaywrightFixture,
  toParamsCode,
  toHeadersCode,
  toMultipartCode,
  parseApiErrorCode,
  AUTH_PAYLOAD_CONST,
  type ResolvedAuth,
} from '../libs';

const DEFAULT_TEST_NAME = 'apigPlaywrightTest';
const DEFAULT_FIXTURE_NAME = 'api';
const DEFAULT_AUTH_FIXTURE_NAME = 'authedApi';
const DEFAULT_TOKEN_PATH = 'token';
const DEFAULT_AUTH_HEADER = 'Authorization';

/**
 * Generates a typed Playwright API client from OpenAPI operations.
 *
 * Produces a `playwright.ts` file with a `createApiClient(ctx)` factory and an
 * `apigPlaywrightTest` fixture built on `test.extend()`. The factory takes any
 * `APIRequestContext`, so the same client works with the standalone `request`
 * fixture and with `page.request`, which shares cookies with the browser.
 * Requires `@playwright/test >= 1.30.0` as a peer dependency.
 * @example playwright()
 * @example playwright({ testName: 'apiTest', withFaker: true })
 */
export const playwright = (options: PlaywrightOptions = {}): ApigPlugin => ({
  name: 'playwright',
  fileName: 'playwright',
  scope: 'operations',
  generate: (ir, config, ctx) => generatePlaywright(ir, config, options, ctx),
  // Mirrors the requests plugin's root file exactly, so the two agree byte for byte when
  // both plugins are enabled and the writer lets the later one overwrite it.
  generateRootFiles: (ir, config) => {
    const errCfg = getErrorConfig(config);
    const withError = errCfg.enabled && !errCfg.importPath;
    const withResponse = config.rawResponse === true;
    const withQuery = needsQueryHelper(ir, config);
    const withParseError = needsParseErrorHelper(config, errCfg.enabled);
    if (!withError && !withResponse && !withQuery && !withParseError) return [];
    return [
      {
        fileName: `${APIG_CONFIG_FILE}.ts`,
        code: buildApigConfigFile(
          withError,
          withResponse,
          withQuery,
          withParseError,
        ),
      },
    ];
  },
});

/**
 * The login operation may live in another group once `groupBy` splits the
 * output — that file gets the plain client and no authenticated fixture.
 */
const resolveAuth = (
  ir: IR,
  config: ApigConfig,
  options: PlaywrightOptions,
  rawResponse: boolean,
): ResolvedAuth | null => {
  const auth = options.authFixture;
  if (!auth) return null;

  const operation = ir.operations.find((op) => op.id === auth.login);

  if (!operation) {
    // Ungrouped output holds every operation, so a miss here is a real typo.
    if ((config.groupBy ?? GROUP_BY.NONE) === GROUP_BY.NONE) {
      throw new Error(
        `playwright plugin: authFixture.login "${auth.login}" is not an operationId in the spec`,
      );
    }
    return null;
  }

  return {
    loginMethod: getMethodName(operation, config),
    fixtureName: auth.fixtureName ?? DEFAULT_AUTH_FIXTURE_NAME,
    strategy: auth.strategy ?? 'cookie',
    payloadExpr:
      typeof auth.payload === 'string'
        ? AUTH_PAYLOAD_CONST
        : auth.payload.import,
    tokenPath: auth.tokenPath ?? DEFAULT_TOKEN_PATH,
    header: auth.header ?? DEFAULT_AUTH_HEADER,
    rawResponse,
  };
};

export const generatePlaywright = (
  ir: IR,
  config: ApigConfig,
  options: PlaywrightOptions = {},
  ctx?: PluginContext,
): PluginResult => {
  logger.plugin('playwright', 'Generating API client...');

  if (options.withFaker && !hasFakerPlugin(config)) {
    throw new Error(
      'playwright plugin with withFaker requires faker plugin — add faker() to plugins',
    );
  }

  const names = buildNames(ir, config, options.testName ?? DEFAULT_TEST_NAME);
  const fixtureName = options.fixtureName ?? DEFAULT_FIXTURE_NAME;
  const errCfg = getErrorConfig(config);
  const rawResponse = config.rawResponse === true;
  // A raw response is handed back untouched — the test owns the status check.
  const errorClass = errCfg.enabled && !rawResponse ? errCfg.className : null;
  // Not `getBaseUrl`: an unset baseUrl is the normal case here, since
  // playwright.config.ts supplies `baseURL` to the request context.
  const baseUrl = options.baseUrl ?? config.baseUrl ?? '';
  const auth = resolveAuth(ir, config, options, rawResponse);
  const samples = options.withFaker
    ? getFakerSamples(ir.operations, config)
    : [];

  const usedTypes = new Set<string>();
  for (const op of ir.operations) {
    if (!rawResponse) {
      if (op.response?.name) usedTypes.add(toPascalCase(op.response.name));
      if (op.response?.items?.name)
        usedTypes.add(toPascalCase(op.response.items.name));
    }
    if (op.body?.schema.name && op.body.contentType !== 'multipart')
      usedTypes.add(toPascalCase(op.body.schema.name));
  }

  const needsApiResponse = rawResponse || errorClass !== null;
  const playwrightTypes = [
    'APIRequestContext',
    ...(needsApiResponse ? ['APIResponse'] : []),
  ];

  const lines: string[] = [
    banner,
    '',
    "import { test as base } from '@playwright/test';",
    `import type { ${playwrightTypes.join(', ')} } from '@playwright/test';`,
  ];

  if (usedTypes.size > 0) {
    lines.push(
      `import type { ${[...usedTypes].join(', ')} } from '${getTypesImport(config, 'operations')}';`,
    );
  }

  if (errorClass) {
    const importPath = errCfg.importPath
      ? (ctx?.customErrorImportPath ?? errCfg.importPath)
      : (ctx?.configImportPath ?? `./${APIG_CONFIG_FILE}`);
    lines.push(`import { ${errorClass} } from '${importPath}';`);
  }

  if (samples.length > 0) {
    const factories = [...new Set(samples.map((s) => s.factory))].join(', ');
    lines.push(
      `import { ${factories} } from '${getRootPluginImport(config, 'faker', 'operations')}';`,
    );
  }

  if (auth && typeof options.authFixture?.payload === 'object') {
    const { import: name, from } = options.authFixture.payload;
    lines.push(`import { ${name} } from '${from}';`);
  }

  lines.push('');

  if (hasQueryParams(ir.operations)) lines.push(toParamsCode);
  if (hasHeaderParams(ir.operations)) lines.push(toHeadersCode);
  if (hasMultipartBody(ir.operations)) lines.push(toMultipartCode);
  if (errorClass) lines.push(parseApiErrorCode);

  lines.push(
    '/**',
    ' * Typed client bound to a Playwright request context.',
    ' *',
    ' * Pass the `request` fixture for standalone API tests, or `page.request` to',
    ' * share cookies and storage state with the browser.',
    ' */',
    `export const ${names.factory} = (ctx: APIRequestContext) => ({`,
  );

  for (const operation of ir.operations) {
    lines.push(
      generatePlaywrightMethod(operation, ir.schemas, baseUrl, config, {
        errorClass,
        rawResponse,
      }),
    );
  }

  lines.push('});', '');
  lines.push(
    `export type ${names.clientType} = ReturnType<typeof ${names.factory}>;`,
    '',
  );

  if (samples.length > 0) {
    lines.push(
      '/** Faker-generated request bodies, named after the operation they feed. */',
    );
    for (const sample of samples) {
      lines.push(`export const ${sample.name} = ${sample.factory};`);
    }
    lines.push('');
  }

  if (auth && typeof options.authFixture?.payload === 'string') {
    lines.push(
      `const ${AUTH_PAYLOAD_CONST} = ${options.authFixture.payload};`,
      '',
    );
  }

  lines.push(generatePlaywrightFixture(names, fixtureName, auth));

  logger.plugin(
    'playwright',
    `Done — ${ir.operations.length} ${ir.operations.length === 1 ? 'method' : 'methods'}`,
  );

  return {
    code: lines.join('\n'),
    exports: [names.factory, names.test, ...samples.map((s) => s.name)],
    typeExports: [names.clientType],
  };
};
