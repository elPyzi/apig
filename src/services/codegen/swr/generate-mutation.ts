import { type ApigConfig, type IROperation, type IRSchema } from '@models';
import { toPascalCase } from '@libs/string';
import { getArgs } from '@services/codegen/common/get-args';
import {
  buildArgsList,
  buildCallArgs,
} from '@services/codegen/common/build-args';
import { getResponseType } from '@services/codegen/common/get-response-type';
import { getErrorTypeName } from '@services/codegen/common/generate-error-types';
import { getFunctionName } from '@services/codegen/common/get-function-name';

export const generateSwrMutationHook = (
  operation: IROperation,
  allSchemas: IRSchema[],
  config: ApigConfig,
  errorHandling = false,
  rawResponse = false,
  errorClass = 'ApigError',
  framework: 'react' | 'vue' = 'react',
): string => {
  const fnName = getFunctionName(operation, config);
  const hookName = `use${toPascalCase(operation.id)}Mutation`;
  const baseType = getResponseType(operation.response, allSchemas);
  const responseType = rawResponse ? `ApigResponse<${baseType}>` : baseType;
  const errorType = errorHandling
    ? operation.errors?.length
      ? `${errorClass}<${getErrorTypeName(operation)}>`
      : errorClass
    : 'Error';
  const allArgs = getArgs(operation, allSchemas);

  const hookArgs = allArgs.filter((a) => a.name !== 'body');
  const hookArgsList = buildArgsList(hookArgs);
  const hookCallArgs = buildCallArgs(hookArgs);
  const keyExpr =
    hookArgs.length > 0
      ? `['${fnName}', ${hookCallArgs}] as const`
      : `'${fnName}'`;
  const bodyArg = allArgs.find((a) => a.name === 'body');

  // swrv has no mutation hook at all — mutations there are a call followed by
  // `mutate` on the key, so the generated shape is a plain async function
  // rather than a hook.
  if (framework === 'vue') {
    const bodyParam = bodyArg ? `arg: ${bodyArg.type}` : '';
    const callArgs = allArgs
      .map((a) => (a.name === 'body' ? 'arg' : a.name))
      .join(', ');
    const outerArgs = hookArgsList || '';

    return [
      `export const ${hookName} = (${outerArgs}) => {`,
      `  return async (${bodyParam}): Promise<${responseType}> => {`,
      `    const result = await ${fnName}(${callArgs});`,
      `    await mutate(JSON.stringify(${keyExpr}), result);`,
      `    return result;`,
      `  };`,
      `};`,
    ].join('\n');
  }

  // An operation with no request body pins SWR's `Arg` generic to `never`, and
  // the options type has to be spelled with the same generics as the hook call —
  // its own defaults resolve to something else and stop being assignable.
  const argType = bodyArg ? bodyArg.type : 'never';
  const generics = `${responseType}, ${errorType}, any, ${argType}`;
  const configType = `SWRMutationConfiguration<${generics}, ${responseType}>`;
  const mutationOptsList = hookArgsList
    ? `${hookArgsList}, options?: ${configType}`
    : `options?: ${configType}`;

  // `_key` is unused but positional, and an unannotated parameter is an implicit
  // `any` in a strict project.
  const fetcher = bodyArg
    ? `(_key: unknown, { arg }: { arg: ${argType} }) => ${fnName}(${allArgs
        .map((a) => (a.name === 'body' ? 'arg' : a.name))
        .join(', ')})`
    : `() => ${fnName}(${hookCallArgs})`;

  return [
    `export const ${hookName} = (${mutationOptsList}) => {`,
    `  return useSWRMutation<${generics}>(`,
    `    ${keyExpr},`,
    `    ${fetcher},`,
    `    options,`,
    `  );`,
    `};`,
  ].join('\n');
};
