import type { ApigConfig } from '@models';

export interface ErrorConfig {
  enabled: boolean;
  className: string;
  importPath: string | null; // null = generate built-in ApigError
}

export const getErrorConfig = (config: ApigConfig): ErrorConfig => {
  const eh = config.errorHandling;

  if (eh === false) return { enabled: false, className: 'ApigError', importPath: null };
  if (eh === undefined || eh === true)
    return { enabled: true, className: 'ApigError', importPath: null };

  return { enabled: true, className: eh.export, importPath: eh.path };
};

/**
 * Resolves the custom error import path relative to the current file's directory.
 * configImportPath is used to derive the depth prefix (e.g. '../../config' → '../../').
 * @example resolveErrorImportPath('./errors', '../../config') → '../../errors'
 */
export const resolveErrorImportPath = (importPath: string, configImportPath: string): string => {
  const prefix = configImportPath.replace(/[^/]*$/, ''); // extract directory prefix: './', '../', '../../'
  const normalized = importPath.replace(/^\.\//, '');     // strip leading './'
  return `${prefix}${normalized}`;
};
