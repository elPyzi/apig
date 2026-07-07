import { type IROperation } from '@models';
import { toCamelCase, toPascalCase } from '@libs/string';
import { getArgs } from '@services/codegen/common/get-args';
import { buildArgsList, buildCallArgs } from '@services/codegen/common/build-args';
import { getResponseType } from '@services/codegen/common/get-response-type';
import { getErrorTypeName } from '@services/codegen/common/generate-error-types';
import { buildSwrKeyExpr } from './query-keys';

const buildSwrErrorType = (
  operation: IROperation,
  errorHandling: boolean,
  errorClass: string,
): string => {
  if (!errorHandling) return '';
  return operation.errors?.length
    ? `, ${errorClass}<${getErrorTypeName(operation)}>`
    : `, ${errorClass}`;
};

export const generateSwrQueryHook = (
  operation: IROperation,
  style: 'functions' | 'object',
  errorHandling = false,
  rawResponse = false,
  errorClass = 'ApigError',
): string => {
  const fnName = toCamelCase(operation.id);
  const hookName = `use${toPascalCase(operation.id)}`;
  const baseType = getResponseType(operation.response);
  const responseType = rawResponse ? `ApigResponse<${baseType}>` : baseType;
  const errorType = buildSwrErrorType(operation, errorHandling, errorClass);
  const args = getArgs(operation);
  const argsList = buildArgsList(args);
  const callArgs = buildCallArgs(args);
  const queryKey = buildSwrKeyExpr(operation, args, style);
  const optionsType = `SWRConfiguration<${responseType}>`;
  const hookArgsList = argsList
    ? `${argsList}, options?: ${optionsType}`
    : `options?: ${optionsType}`;

  return [
    `export const ${hookName} = (${hookArgsList}) => {`,
    `  return useSWR<${responseType}${errorType}>(${queryKey}, () => ${fnName}(${callArgs}), options);`,
    `};`,
  ].join('\n');
};
