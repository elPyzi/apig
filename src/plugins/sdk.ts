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
} from '../libs';

/**
 * Generates typed SDK request functions from OpenAPI operations.
 *
 * Produces a `sdk.ts` file with async functions for each endpoint.
 * Supports `fetch`, `axios`, `ky`, and `ofetch` HTTP clients.
 * @example sdk()
 */
export const sdk = (): ApigPlugin => ({
  name: 'sdk',
  fileName: 'sdk',
  scope: 'operations',
  generate: (ir, config, ctx) => generateSdk(ir, config, ctx?.configImportPath ?? './config', ctx?.customErrorImportPath, ctx?.clientImportPath),
  generateRootFiles: (_ir, config) => {
    const errCfg = getErrorConfig(config);
    const withError = errCfg.enabled && !errCfg.importPath;
    const withResponse = config.rawResponse === true;
    if (!withError && !withResponse) return [];
    return [{ fileName: `${APIG_CONFIG_FILE}.ts`, code: buildApigConfigFile(withError, withResponse) }];
  },
});

export const generateSdk = (ir: IR, config: ApigConfig, configImportPath = './config', customErrorImportPath?: string, clientImportPath?: string): PluginResult => {
  const { name: clientName, path: clientPath } = getClientImport(config, clientImportPath);
  const typesImport = getTypesImport(config);
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

  if (errCfg.enabled) {
    if (errCfg.importPath) {
      const errorPath = customErrorImportPath ?? errCfg.importPath;
      lines.push(`import { ${errCfg.className} } from '${errorPath}';`);
      if (config.rawResponse)
        lines.push(`import type { ApigResponse } from '${configImportPath}';`);
    } else {
      lines.push(`import { ${errCfg.className} } from '${configImportPath}';`);
      if (config.rawResponse)
        lines.push(`import type { ApigResponse } from '${configImportPath}';`);
    }
  } else if (config.rawResponse) {
    lines.push(`import type { ApigResponse } from '${configImportPath}';`);
  }

  lines.push('');

  for (const operation of ir.operations) {
    if (errCfg.enabled) {
      const errorType = generateErrorType(operation);
      if (errorType) {
        lines.push(errorType);
        lines.push('');
      }
    }
    lines.push(generateFunction(operation, clientName, baseUrl, config));
    lines.push('');
  }

  return {
    code: lines.join('\n'),
    exports: ir.operations.map((op) => toCamelCase(op.id)),
    typeExports: [],
  };
};
