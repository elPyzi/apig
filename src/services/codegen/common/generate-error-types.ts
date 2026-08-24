import type { IROperation, IRSchema } from '@models';
import { toPascalCase } from '@libs/string';
import {
  generateTypeValue,
  isDeclaredSchema,
} from '@services/codegen/common/generate-type-value';

export const getErrorTypeName = (operation: IROperation): string =>
  `${toPascalCase(operation.id)}Errors`;

export const generateErrorType = (
  operation: IROperation,
  allSchemas: IRSchema[],
): string | null => {
  if (!operation.errors?.length) return null;

  const name = getErrorTypeName(operation);
  const variants = operation.errors.map(({ status, schema }) => {
    const bodyType = isDeclaredSchema(schema, allSchemas)
      ? toPascalCase(schema.name!)
      : generateTypeValue(schema, allSchemas);
    return `  | { status: ${status}; body: ${bodyType} }`;
  });

  return `export type ${name} =\n${variants.join('\n')};`;
};
