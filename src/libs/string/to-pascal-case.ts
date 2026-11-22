import { capitalize } from '@libs/string/capitalize';

/**
 * Capitalizes each separator-delimited word and keeps every other character.
 * For names that need not be identifiers — a file, a quoted key — where
 * stripping more would rename output that already exists.
 */
export const joinPascalWords = (str: string): string =>
  str
    .split(/[-_/\s]+/)
    .map(capitalize)
    .join('');

/**
 * The result names a type, a schema or a function, so it has to be an
 * identifier whatever the spec called it: `v1.Pet` and
 * `io.k8s.api.core.v1.Pod` are ordinary component names, and `3dModel` opens
 * with a digit.
 */
export const toPascalCase = (str: string): string => {
  const pascal = str
    .split(/[^\p{L}\p{N}]+/u)
    .map(capitalize)
    .join('');
  return /^\p{N}/u.test(pascal) ? `_${pascal}` : pascal;
};
