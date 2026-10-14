import { type ApigConfig, type IROperation, type IRSchema } from '@models';
import { toPascalCase } from '@libs/string';
import { getResponseType } from '@services/codegen/common/get-response-type';
import { getArgs } from '@services/codegen/common/get-args';
import { getErrorTypeName } from '@services/codegen/common/generate-error-types';
import type { TanstackFrameworkConfig } from './framework';
import { getFunctionName } from '@services/codegen/common/get-function-name';

const DEFAULT_FW: TanstackFrameworkConfig = {
  pkg: '@tanstack/react-query',
  hookFn: 'use',
  typeFn: 'Use',
  exportPrefix: 'use',
  optionsAreAccessors: false,
};

export const generateTanstackMutation = (
  operation: IROperation,
  allSchemas: IRSchema[],
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

  const varsType =
    args.length > 0
      ? `{ ${args.map((a) => `${a.name}: ${a.type}`).join('; ')} }`
      : 'void';
  const mutationFnArgs = args.length > 0 ? `vars: ${varsType}` : '';
  const callArgs =
    args.length > 0 ? args.map((a) => `vars.${a.name}`).join(', ') : '';
  const errGeneric = errorHandling
    ? operation.errors?.length
      ? `${errorClass}<${getErrorTypeName(operation)}>`
      : errorClass
    : 'Error';
  const typeGenerics = `<${responseType}, ${errGeneric}, ${varsType}>`;
  // Solid types its options as an accessor, so the omission has to reach through
  // the function and the hook has to be handed a thunk.
  const optionsName = `${fw.typeFn}MutationOptions${typeGenerics}`;
  const optionsType = `Omit<${
    fw.optionsAreAccessors ? `ReturnType<${optionsName}>` : optionsName
  }, 'mutationFn'>`;
  const open = fw.optionsAreAccessors ? '(() => ({' : '({';
  const close = fw.optionsAreAccessors ? '  }));' : '  });';

  return [
    `export const ${fw.exportPrefix}${pascalName}Mutation = (options?: ${optionsType}) =>`,
    `  ${fw.hookFn}Mutation${typeGenerics}${open}`,
    `    mutationFn: (${mutationFnArgs}) =>`,
    `      ${name}(${callArgs}),`,
    `    ...options,`,
    close,
  ].join('\n');
};
