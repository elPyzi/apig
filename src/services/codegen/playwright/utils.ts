import {
  GROUP_BY,
  NAMING_CASES,
  type ApigConfig,
  type IR,
  type IROperation,
} from '@models';
import { CaseFns, capitalize, toCamelCase, toPascalCase } from '@libs/string';
import { getArgs, type FnArg } from '@services/codegen/common/get-args';

/** Playwright's own shape for a file field inside `multipart`. */
export const PLAYWRIGHT_FILE_TYPE =
  '{ name: string; mimeType: string; buffer: Buffer }';

/** What `getArgs` calls a binary multipart field — a browser type Playwright does not take. */
const BROWSER_FILE_TYPE = 'File | Blob';

/**
 * Arguments of a generated client method.
 *
 * Identical to the SDK's, except for binary multipart fields: the SDK targets a
 * browser and takes `File | Blob`, while Playwright runs in Node and wants the
 * `{ name, mimeType, buffer }` form its `multipart` option accepts.
 */
export const getPlaywrightArgs = (operation: IROperation): FnArg[] =>
  getArgs(operation).map((arg) =>
    arg.type === BROWSER_FILE_TYPE
      ? { ...arg, type: PLAYWRIGHT_FILE_TYPE }
      : arg,
  );

/**
 * Prefix that keeps exports unique once `groupBy` splits operations across files.
 *
 * Every group would otherwise export `createApiClient` and the generated barrel
 * file re-exports all of them, which does not compile. Ungrouped output needs no
 * prefix and keeps the plain names.
 */
export const getExportPrefix = (ir: IR, config: ApigConfig): string => {
  const operation = ir.operations[0];
  if (!operation) return '';

  switch (config.groupBy ?? GROUP_BY.NONE) {
    case GROUP_BY.TAGS:
      return toPascalCase(operation.tag ?? 'default');
    case GROUP_BY.ENDPOINTS:
    case GROUP_BY.OPERATIONS:
      return toPascalCase(operation.id);
    default:
      return '';
  }
};

export interface PlaywrightNames {
  /** Factory that binds an `APIRequestContext` to the operations. */
  factory: string;
  /** Type alias for the bound client. */
  clientType: string;
  /** Exported `test` extended with the fixtures. */
  test: string;
}

export const buildNames = (
  ir: IR,
  config: ApigConfig,
  testName: string,
): PlaywrightNames => {
  const prefix = getExportPrefix(ir, config);

  return {
    factory: `create${prefix}ApiClient`,
    clientType: `${prefix}ApiClient`,
    test: prefix ? `${toCamelCase(prefix)}${capitalize(testName)}` : testName,
  };
};

/** Method name for an operation — the same transform the SDK applies. */
export const getMethodName = (
  operation: IROperation,
  config: ApigConfig,
): string => CaseFns[config.functionNaming ?? NAMING_CASES.CAMEL](operation.id);

export const hasQueryParams = (operations: IROperation[]): boolean =>
  operations.some((op) => op.params.query.length > 0);

export const hasHeaderParams = (operations: IROperation[]): boolean =>
  operations.some((op) => op.params.header.length > 0);

export const hasMultipartBody = (operations: IROperation[]): boolean =>
  operations.some((op) => op.body?.contentType === 'multipart');

export interface FakerSample {
  /** Exported name — `sampleCreatePet`. */
  name: string;
  /** Factory it aliases in the faker plugin's output — `generateCreatePetInput`. */
  factory: string;
}

/**
 * Faker factories for request bodies, aliased per operation.
 *
 * A test cares about "a valid body for createPet", not about which schema backs
 * it, so the alias is named after the operation.
 */
export const getFakerSamples = (
  operations: IROperation[],
  config: ApigConfig,
): FakerSample[] => {
  const samples: FakerSample[] = [];
  const seen = new Set<string>();

  for (const operation of operations) {
    const schemaName = operation.body?.schema.name;
    if (!schemaName || operation.body?.contentType === 'multipart') continue;

    const name = `sample${toPascalCase(getMethodName(operation, config))}`;
    if (seen.has(name)) continue;
    seen.add(name);

    samples.push({ name, factory: `generate${toPascalCase(schemaName)}` });
  }

  return samples;
};

/** Indents an already-rendered block by one level, leaving blank lines bare. */
export const indent = (code: string, spaces = 2): string =>
  code
    .split('\n')
    .map((line) => (line.length > 0 ? `${' '.repeat(spaces)}${line}` : line))
    .join('\n');
