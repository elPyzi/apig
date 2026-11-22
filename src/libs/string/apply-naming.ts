import type { NamingCase } from '@models';
import { toKebabCase } from '@libs/string/to-kebab-case';
import { toSnakeCase } from '@libs/string/to-snake-case';
import { joinPascalWords } from '@libs/string/to-pascal-case';

/** Names a file or directory — not an identifier, so `io.k8s` stays `Io.k8s`. */
export const applyNaming = (str: string, naming: NamingCase): string => {
  switch (naming) {
    case 'kebab-case':
      return toKebabCase(str);
    case 'camelCase': {
      const pascal = joinPascalWords(str);
      return pascal.charAt(0).toLowerCase() + pascal.slice(1);
    }
    case 'snake_case':
      return toSnakeCase(str);
    case 'PascalCase':
      return joinPascalWords(str);
  }
};
