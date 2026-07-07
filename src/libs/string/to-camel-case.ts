import { toPascalCase } from '@libs/string/to-pascal-case';

export const toCamelCase = (str: string): string => {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};
