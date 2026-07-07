import type { NamingCase } from '@models';
import { toKebabCase } from '@libs/string/to-kebab-case';
import { toCamelCase } from '@libs/string/to-camel-case';
import { toSnakeCase } from '@libs/string/to-snake-case';
import { toPascalCase } from '@libs/string/to-pascal-case';

export const applyNaming = (str: string, naming: NamingCase): string => {
  switch (naming) {
    case 'kebab-case':
      return toKebabCase(str);
    case 'camelCase':
      return toCamelCase(str);
    case 'snake_case':
      return toSnakeCase(str);
    case 'PascalCase':
      return toPascalCase(str);
  }
};
