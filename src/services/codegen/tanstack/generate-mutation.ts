import { type IROperation, type IRSchema } from '@models';
import { toCamelCase, toPascalCase } from '@libs/string';
import { getResponseType } from '@services/codegen/common/get-response-type';
import { getArgs } from '@services/codegen/common/get-args';
import { getErrorTypeName } from '@services/codegen/common/generate-error-types';
import type { TanstackFrameworkConfig } from './framework';

const DEFAULT_FW: TanstackFrameworkConfig = {
  pkg: '@tanstack/react-query',
  hookFn: 'use',
  typeFn: 'Use',
  exportPrefix: 'use',
};

export const generateTanstackMutation = (
  operation: IROperation,
  allSchemas: IRSchema[],
  errorHandling = false,
  rawResponse = false,
  errorClass = 'ApigError',
  fw: TanstackFrameworkConfig = DEFAULT_FW,
): string => {
  const name = toCamelCase(operation.id);
  const pascalName = toPascalCase(operation.id);
  const baseType = getResponseType(operation.response, allSchemas);
  const responseType = rawResponse ? `ApigResponse<${baseType}>` : baseType;
  const args = getArgs(operation);

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
  const optionsType = `Omit<${fw.typeFn}MutationOptions${typeGenerics}, 'mutationFn'>`;

  return [
    `export const ${fw.exportPrefix}${pascalName}Mutation = (options?: ${optionsType}) =>`,
    `  ${fw.hookFn}Mutation${typeGenerics}({`,
    `    mutationFn: (${mutationFnArgs}) =>`,
    `      ${name}(${callArgs}),`,
    `    ...options,`,
    `  });`,
  ].join('\n');
};
