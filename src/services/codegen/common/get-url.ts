import { toParamName } from '@libs/string';

/**
 * Path placeholders are substituted with the parameter names the generated
 * signature actually uses — `\w` never matched a dash, so `{structure-type}`
 * used to survive into the request URL verbatim.
 */
export const getUrl = (path: string, baseUrl: string): string => {
  const fullPath = baseUrl ? `${baseUrl}${path}` : path;
  const interpolated = fullPath.replace(
    /\{([^}]+)\}/g,
    (_, name: string) => '${' + toParamName(name) + '}',
  );
  return '`' + interpolated + '`';
};
