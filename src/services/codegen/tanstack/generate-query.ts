import { type IROperation } from '@models';
import { toCamelCase, toPascalCase } from '@libs/string';
import { getResponseType } from '@services/codegen/common/get-response-type';
import { getArgs } from '@services/codegen/common/get-args';
import { buildArgsList, buildCallArgs } from '@services/codegen/common/build-args';
import { getErrorTypeName } from '@services/codegen/common/generate-error-types';
import { buildQueryKeyExpr } from './query-keys';

const buildErrorGeneric = (
  operation: IROperation,
  errorHandling: boolean,
  errorClass: string,
): string => {
  if (!errorHandling) return '';
  const hasErrors = operation.errors?.length;
  return hasErrors
    ? `, ${errorClass}<${getErrorTypeName(operation)}>`
    : `, ${errorClass}`;
};

export const generateQuery = (
  operation: IROperation,
  queryKeysStyle: 'functions' | 'object',
  errorHandling = false,
  rawResponse = false,
  errorClass = 'ApigError',
): string => {
  const name = toCamelCase(operation.id);
  const pascalName = toPascalCase(operation.id);
  const baseType = getResponseType(operation.response);
  const responseType = rawResponse ? `ApigResponse<${baseType}>` : baseType;
  const errorType = buildErrorGeneric(operation, errorHandling, errorClass);
  const args = getArgs(operation);
  const argsList = buildArgsList(args);
  const callArgs = buildCallArgs(args);
  const queryKey = buildQueryKeyExpr(operation, args, queryKeysStyle);
  const errorGeneric = errorType || `, ${errorClass}`;
  const optionsType = `Omit<UseQueryOptions<${responseType}, ${errorClass}>, 'queryKey' | 'queryFn'>`;
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
    `export const use${pascalName}Query = (${hookArgs}) =>`,
    `  useQuery<${responseType}, ${errorClass}>({ ...${name}QueryOptions(${callArgs}), ...options });`,
  ].join('\n');
};

export const generateInfiniteQuery = (
  operation: IROperation,
  queryKeysStyle: 'functions' | 'object',
  errorClass = 'ApigError',
): string => {
  const name = toCamelCase(operation.id);
  const pascalName = toPascalCase(operation.id);
  const responseType = getResponseType(operation.response);
  const args = getArgs(operation);
  const argsList = buildArgsList(args);
  const callArgs = buildCallArgs(args);
  const queryKey = buildQueryKeyExpr(operation, args, queryKeysStyle);
  const fullGenerics = `<${responseType}, ${errorClass}, InfiniteData<${responseType}>, readonly unknown[], number>`;
  const optionsType = `Omit<UseInfiniteQueryOptions${fullGenerics}, 'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'>`;
  const hookArgs = argsList
    ? `${argsList}, options?: ${optionsType}`
    : `options?: ${optionsType}`;

  return [
    `export const useInfinity${pascalName}Query = (${hookArgs}) =>`,
    `  useInfiniteQuery${fullGenerics}({`,
    `    queryKey: ${queryKey},`,
    `    queryFn: (_pageParam) => ${name}(${callArgs}),`,
    `    getNextPageParam: () => undefined,`,
    `    initialPageParam: 0,`,
    `    ...options,`,
    `  });`,
  ].join('\n');
};

export const generateSuspenseQuery = (operation: IROperation): string => {
  const name = toCamelCase(operation.id);
  const pascalName = toPascalCase(operation.id);
  const responseType = getResponseType(operation.response);
  const args = getArgs(operation);
  const argsList = buildArgsList(args);
  const callArgs = buildCallArgs(args);
  const optionsType = `Omit<UseSuspenseQueryOptions<${responseType}, ApigError>, 'queryKey' | 'queryFn'>`;
  const hookArgs = argsList
    ? `${argsList}, options?: ${optionsType}`
    : `options?: ${optionsType}`;

  return [
    `export const useSuspense${pascalName}Query = (${hookArgs}) =>`,
    `  useSuspenseQuery<${responseType}, ApigError>({ ...${name}QueryOptions(${callArgs}), ...options });`,
  ].join('\n');
};
