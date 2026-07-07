import { type IROperation } from '@models';
import { toCamelCase, toPascalCase } from '@libs/string';
import { getResponseType } from '@services/codegen/common/get-response-type';
import { getArgs } from '@services/codegen/common/get-args';
import { getErrorTypeName } from '@services/codegen/common/generate-error-types';

export const generateTanstackMutation = (
  operation: IROperation,
  errorHandling = false,
  rawResponse = false,
  errorClass = 'ApigError',
): string => {
  const name = toCamelCase(operation.id);
  const pascalName = toPascalCase(operation.id);
  const baseType = getResponseType(operation.response);
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
  const optionsType = `Omit<UseMutationOptions${typeGenerics}, 'mutationFn'>`;

  return [
    `export const use${pascalName}Mutation = (options?: ${optionsType}) =>`,
    `  useMutation${typeGenerics}({`,
    `    mutationFn: (${mutationFnArgs}) =>`,
    `      ${name}(${callArgs}),`,
    `    ...options,`,
    `  });`,
  ].join('\n');
};
