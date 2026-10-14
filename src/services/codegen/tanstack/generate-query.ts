import { type ApigConfig, type IROperation, type IRSchema } from '@models';
import { toPascalCase } from '@libs/string';
import { getResponseType } from '@services/codegen/common/get-response-type';
import { getArgs } from '@services/codegen/common/get-args';
import {
  buildArgsList,
  buildCallArgs,
} from '@services/codegen/common/build-args';
import { getErrorTypeName } from '@services/codegen/common/generate-error-types';
import { buildQueryKeyExpr } from './query-keys';
import type { TanstackFrameworkConfig } from './framework';
import { getFunctionName } from '@services/codegen/common/get-function-name';

/**
 * The error type the hook and its `queryOptions` helper have to agree on.
 *
 * The helper is spread into the hook, so options typed `ApigError<GetPetErrors>`
 * flowing into a hook generic over a bare `ApigError` is an overload error in
 * the user's project — the two must be built from the same expression.
 */
const buildErrorType = (
  operation: IROperation,
  errorHandling: boolean,
  errorClass: string,
): string =>
  errorHandling && operation.errors?.length
    ? `${errorClass}<${getErrorTypeName(operation)}>`
    : errorClass;

/**
 * Options type a caller passes in.
 *
 * Solid types its options as an accessor, so `Omit` has to reach through the
 * function to the object it returns — omitting keys off a function type does
 * nothing.
 */
export const buildQueryOptionsType = (
  fw: TanstackFrameworkConfig,
  responseType: string,
  errorType: string,
  kind = '',
): string => {
  const optionsName = `${fw.typeFn}${kind}QueryOptions<${responseType}, ${errorType}>`;
  if (!fw.optionsAreAccessors)
    return `Omit<${optionsName}, 'queryKey' | 'queryFn'>`;

  // Solid's accessor resolves to the general options shape, and its overloads
  // split on whether `initialData` is present — leaving it in matches neither.
  // A generated hook targets the no-initial-data overload.
  return `Omit<ReturnType<${optionsName}>, 'queryKey' | 'queryFn' | 'initialData'>`;
};

/** Solid's hooks take a thunk; every other binding takes the object itself. */
export const wrapOptions = (
  fw: TanstackFrameworkConfig,
  call: string,
  body: string,
): string =>
  fw.optionsAreAccessors
    ? `${call}(() => ({ ${body} }))`
    : `${call}({ ${body} })`;

const DEFAULT_FW: TanstackFrameworkConfig = {
  pkg: '@tanstack/react-query',
  hookFn: 'use',
  typeFn: 'Use',
  exportPrefix: 'use',
  optionsAreAccessors: false,
};

export const generateQuery = (
  operation: IROperation,
  allSchemas: IRSchema[],
  queryKeysStyle: 'functions' | 'object',
  config: ApigConfig,
  errorHandling = false,
  rawResponse = false,
  errorClass = 'ApigError',
  fw: TanstackFrameworkConfig = DEFAULT_FW,
): string => {
  const name = getFunctionName(operation, config);
  const pascalName = toPascalCase(operation.id);
  const baseType = getResponseType(operation.response, allSchemas);
  const responseType = rawResponse ? `ApigResponse<${baseType}>` : baseType;
  const args = getArgs(operation, allSchemas);
  const argsList = buildArgsList(args);
  const callArgs = buildCallArgs(args);
  const queryKey = buildQueryKeyExpr(config, operation, args, queryKeysStyle);
  const errorType = buildErrorType(operation, errorHandling, errorClass);
  const errorGeneric = `, ${errorType}`;
  const optionsType = buildQueryOptionsType(fw, responseType, errorType);
  const hookArgs = argsList
    ? `${argsList}, options?: ${optionsType}`
    : `options?: ${optionsType}`;

  return [
    `export const ${name}QueryOptions = (${argsList}) =>`,
    `  queryOptions<${responseType}${errorGeneric}>({`,
    `    queryKey: ${queryKey},`,
    `    queryFn: () => ${name}(${callArgs}),`,
    `  });`,
    '',
    `export const ${fw.exportPrefix}${pascalName}Query = (${hookArgs}) =>`,
    `  ${wrapOptions(fw, `${fw.hookFn}Query<${responseType}, ${errorType}>`, `...${name}QueryOptions(${callArgs}), ...options`)};`,
  ].join('\n');
};

export const generateInfiniteQuery = (
  operation: IROperation,
  allSchemas: IRSchema[],
  queryKeysStyle: 'functions' | 'object',
  config: ApigConfig,
  errorClass = 'ApigError',
  fw: TanstackFrameworkConfig = DEFAULT_FW,
): string => {
  const name = getFunctionName(operation, config);
  const pascalName = toPascalCase(operation.id);
  const responseType = getResponseType(operation.response, allSchemas);
  const args = getArgs(operation, allSchemas);
  const argsList = buildArgsList(args);
  const callArgs = buildCallArgs(args);
  const queryKey = buildQueryKeyExpr(config, operation, args, queryKeysStyle);
  const fullGenerics = `<${responseType}, ${errorClass}, InfiniteData<${responseType}>, readonly unknown[], number>`;
  const optionsType = `Omit<${fw.typeFn}InfiniteQueryOptions${fullGenerics}, 'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'>`;
  const hookArgs = argsList
    ? `${argsList}, options?: ${optionsType}`
    : `options?: ${optionsType}`;

  return [
    `export const ${fw.exportPrefix}Infinity${pascalName}Query = (${hookArgs}) =>`,
    `  ${fw.hookFn}InfiniteQuery${fullGenerics}({`,
    `    queryKey: ${queryKey},`,
    `    queryFn: (_pageParam) => ${name}(${callArgs}),`,
    `    getNextPageParam: () => undefined,`,
    `    initialPageParam: 0,`,
    `    ...options,`,
    `  });`,
  ].join('\n');
};

export const generateSuspenseQuery = (
  operation: IROperation,
  allSchemas: IRSchema[],
  config: ApigConfig,
  errorHandling = false,
  errorClass = 'ApigError',
  fw: TanstackFrameworkConfig = DEFAULT_FW,
): string => {
  const name = getFunctionName(operation, config);
  const pascalName = toPascalCase(operation.id);
  const responseType = getResponseType(operation.response, allSchemas);
  const args = getArgs(operation, allSchemas);
  const argsList = buildArgsList(args);
  const callArgs = buildCallArgs(args);
  const errorType = buildErrorType(operation, errorHandling, errorClass);
  const optionsType = buildQueryOptionsType(
    fw,
    responseType,
    errorType,
    'Suspense',
  );
  const hookArgs = argsList
    ? `${argsList}, options?: ${optionsType}`
    : `options?: ${optionsType}`;

  return [
    `export const ${fw.exportPrefix}Suspense${pascalName}Query = (${hookArgs}) =>`,
    `  ${wrapOptions(fw, `${fw.hookFn}SuspenseQuery<${responseType}, ${errorType}>`, `...${name}QueryOptions(${callArgs}), ...options`)};`,
  ].join('\n');
};
