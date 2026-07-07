import type { IROperation } from '@models';
import { toPascalCase } from '@libs/string';
import { generateTypeValue } from '@services/codegen/common/generate-type-value';

export const getErrorTypeName = (operation: IROperation): string =>
  `${toPascalCase(operation.id)}Errors`;

export const generateErrorType = (operation: IROperation): string | null => {
  if (!operation.errors?.length) return null;

  const name = getErrorTypeName(operation);
  const variants = operation.errors.map(({ status, schema }) => {
    const bodyType = schema.name
      ? toPascalCase(schema.name)
      : generateTypeValue(schema);
    return `  | { status: ${status}; body: ${bodyType} }`;
  });

  return `export type ${name} =\n${variants.join('\n')};`;
};
