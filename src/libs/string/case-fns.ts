import { NAMING_CASES, type NamingCase } from '@models';
import { toCamelCase } from '@libs/string/to-camel-case';
import { toKebabCase } from '@libs/string/to-kebab-case';
import { toPascalCase } from '@libs/string/to-pascal-case';
import { toSnakeCase } from '@libs/string/to-snake-case';

export const CaseFns = {
  [NAMING_CASES.CAMEL]: (value: string) => toCamelCase(value),
  [NAMING_CASES.KEBAB]: (value: string) => toKebabCase(value),
  [NAMING_CASES.PASCAL]: (value: string) => toPascalCase(value),
  [NAMING_CASES.SNAKE]: (value: string) => toSnakeCase(value),
};
