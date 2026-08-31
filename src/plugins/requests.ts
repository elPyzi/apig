import {
  type ApigConfig,
  type PluginResult,
  type ApigPlugin,
  type IR,
  banner,
} from '@models';
import {
  toCamelCase,
  toPascalCase,
  getTypesImport,
  getClientImport,
  getBaseUrl,
  generateFunction,
  buildApigConfigFile,
  APIG_CONFIG_FILE,
  generateErrorType,
  getErrorConfig,
  needsQueryHelper,
  needsParseErrorHelper,
  TO_QUERY_FN,
  PARSE_ERROR_FN,
} from '../libs';

/**
 * Generates typed requests request functions from OpenAPI operations.
 *
 * Produces a `requests.ts` file with async functions for each endpoint.
 * Supports `fetch`, `axios`, `ky`, and `ofetch` HTTP clients.
 * @example requests()
 */
export const requests = (): ApigPlugin => ({
  name: 'requests',
  fileName: 'requests',
  scope: 'operations',
  generate: (ir, config, ctx) =>
    generateRequests(
      ir,
      config,
      ctx?.configImportPath ?? './config',
      ctx?.customErrorImportPath,
      ctx?.clientImportPath,
    ),
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

export const generateRequests = (
  ir: IR,
  config: ApigConfig,
  configImportPath = './config',
  customErrorImportPath?: string,
  clientImportPath?: string,
): PluginResult => {
  const { name: clientName, path: clientPath } = getClientImport(
    config,
    clientImportPath,
  );
  const typesImport = getTypesImport(config, 'operations');
  const baseUrl = getBaseUrl(config);

  const usedTypes = new Set<string>();
  const errCfg = getErrorConfig(config);
  for (const op of ir.operations) {
    if (op.response?.name) usedTypes.add(toPascalCase(op.response.name));
    if (op.response?.items?.name)
      usedTypes.add(toPascalCase(op.response.items.name));
    if (op.body?.schema.name) usedTypes.add(toPascalCase(op.body.schema.name));
    if (errCfg.enabled && op.errors) {
      for (const { schema } of op.errors) {
        if (schema.name) usedTypes.add(toPascalCase(schema.name));
      }
    }
  }

  const lines: string[] = [banner, ''];

  if (clientName && clientPath) {
    lines.push(`import { ${clientName} } from '${clientPath}';`);
  }

  if (usedTypes.size > 0) {
    lines.push(
      `import type { ${[...usedTypes].join(', ')} } from '${typesImport}';`,
    );
  }

  const configValueImports: string[] = [];

  if (errCfg.enabled && errCfg.importPath) {
    const errorPath = customErrorImportPath ?? errCfg.importPath;
    lines.push(`import { ${errCfg.className} } from '${errorPath}';`);
  } else if (errCfg.enabled) {
    configValueImports.push(errCfg.className);
  }

  if (needsParseErrorHelper(config, errCfg.enabled))
    configValueImports.push(PARSE_ERROR_FN);

  if (needsQueryHelper(ir, config)) configValueImports.push(TO_QUERY_FN);

  if (configValueImports.length > 0) {
    lines.push(
      `import { ${configValueImports.join(', ')} } from '${configImportPath}';`,
    );
  }

  if (config.rawResponse) {
    lines.push(`import type { ApigResponse } from '${configImportPath}';`);
  }

  lines.push('');

  for (const operation of ir.operations) {
    if (errCfg.enabled) {
      const errorType = generateErrorType(operation, ir.schemas);
      if (errorType) {
        lines.push(errorType);
        lines.push('');
      }
    }
    lines.push(
      generateFunction(operation, ir.schemas, clientName, baseUrl, config),
    );
    lines.push('');
  }

  return {
    code: lines.join('\n'),
    exports: ir.operations.map((op) => toCamelCase(op.id)),
    typeExports: [],
  };
};
