import { type ApigConfig, type IROperation, type IRSchema } from '@models';
import { toPascalCase } from '@libs/string';
import { getArgs } from '@services/codegen/common/get-args';
import {
  buildArgsList,
  buildCallArgs,
} from '@services/codegen/common/build-args';
import { getResponseType } from '@services/codegen/common/get-response-type';
import { getErrorTypeName } from '@services/codegen/common/generate-error-types';
import { buildSwrKeyExpr } from './query-keys';
import { getFunctionName } from '@services/codegen/common/get-function-name';

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
  allSchemas: IRSchema[],
  style: 'functions' | 'object',
  config: ApigConfig,
  errorHandling = false,
  rawResponse = false,
  errorClass = 'ApigError',
  framework: 'react' | 'vue' = 'react',
): string => {
  const fnName = getFunctionName(operation, config);
  const hookName = `use${toPascalCase(operation.id)}`;
  const baseType = getResponseType(operation.response, allSchemas);
  const responseType = rawResponse ? `ApigResponse<${baseType}>` : baseType;
  const errorType = buildSwrErrorType(operation, errorHandling, errorClass);
  const args = getArgs(operation, allSchemas);
  const argsList = buildArgsList(args);
  const callArgs = buildCallArgs(args);
  const queryKey = buildSwrKeyExpr(config, operation, args, style);
  // swrv is a different package with a different surface: the hook is a default
  // export called `useSWRV` and its options type is `IConfig`.
  const isVue = framework === 'vue';
  const hookFn = isVue ? 'useSWRV' : 'useSWR';
  // swrv's key type is `any[]`, which a readonly tuple does not satisfy
  const keyArg = isVue ? `[...${queryKey}]` : queryKey;
  const optionsType = isVue ? 'IConfig' : `SWRConfiguration<${responseType}>`;
  const hookArgsList = argsList
    ? `${argsList}, options?: ${optionsType}`
    : `options?: ${optionsType}`;

  return [
    `export const ${hookName} = (${hookArgsList}) => {`,
    `  return ${hookFn}<${responseType}${errorType}>(${keyArg}, () => ${fnName}(${callArgs}), options);`,
    `};`,
  ].join('\n');
};
