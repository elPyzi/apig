import { type IROperation } from '@models';
import { toCamelCase, toPascalCase } from '@libs/string';
import { getArgs } from '@services/codegen/common/get-args';
import { buildArgsList, buildCallArgs } from '@services/codegen/common/build-args';
import { getResponseType } from '@services/codegen/common/get-response-type';
import { getErrorTypeName } from '@services/codegen/common/generate-error-types';

export const generateSwrMutationHook = (
  operation: IROperation,
  errorHandling = false,
  rawResponse = false,
  errorClass = 'ApigError',
): string => {
  const fnName = toCamelCase(operation.id);
  const hookName = `use${toPascalCase(operation.id)}Mutation`;
  const baseType = getResponseType(operation.response);
  const responseType = rawResponse ? `ApigResponse<${baseType}>` : baseType;
  const errorType = errorHandling
    ? operation.errors?.length
      ? `${errorClass}<${getErrorTypeName(operation)}>`
      : errorClass
    : 'Error';
  const allArgs = getArgs(operation);

  const hookArgs = allArgs.filter((a) => a.name !== 'body');
  const hookArgsList = buildArgsList(hookArgs);
  const hookCallArgs = buildCallArgs(hookArgs);
  const keyExpr =
    hookArgs.length > 0
      ? `['${fnName}', ${hookCallArgs}] as const`
      : `'${fnName}'`;
  const bodyArg = allArgs.find((a) => a.name === 'body');

  if (bodyArg) {
    const argType = bodyArg.type;
    const sdkCallArgs = allArgs
      .map((a) => (a.name === 'body' ? 'arg' : a.name))
      .join(', ');
    const mutationOptsList = hookArgsList
      ? `${hookArgsList}, options?: SWRMutationConfiguration<${responseType}, ${errorType}>`
      : `options?: SWRMutationConfiguration<${responseType}, ${errorType}>`;
    return [
      `export const ${hookName} = (${mutationOptsList}) => {`,
      `  return useSWRMutation<${responseType}, ${errorType}, any, ${argType}>(`,
      `    ${keyExpr},`,
      `    (_key, { arg }: { arg: ${argType} }) => ${fnName}(${sdkCallArgs}),`,
      `    options,`,
      `  );`,
      `};`,
    ].join('\n');
  }

  const mutationOptsList = hookArgsList
    ? `${hookArgsList}, options?: SWRMutationConfiguration<${responseType}, ${errorType}>`
    : `options?: SWRMutationConfiguration<${responseType}, ${errorType}>`;
  return [
    `export const ${hookName} = (${mutationOptsList}) => {`,
    `  return useSWRMutation<${responseType}, ${errorType}, any>(`,
    `    ${keyExpr},`,
    `    () => ${fnName}(${hookCallArgs}),`,
    `    options,`,
    `  );`,
    `};`,
  ].join('\n');
};
