import { GROUP_BY, type ApigConfig, type ApigPlugin } from '@models';

/** Where the file doing the import lives — the same value as the plugin's `scope`. */
export type FileScope = 'root' | 'operations';

/**
 * Path prefix from the importing file back to the output root.
 *
 * Root-scoped plugins always write to the output root, so they reach siblings
 * with `./` no matter how the project is grouped. Only operation-scoped files
 * are nested by `groupBy` and have to climb back up.
 */
export const getRootPrefix = (config: ApigConfig, scope: FileScope): string => {
  if (scope === 'root') return './';

  switch (config?.groupBy ?? GROUP_BY.NONE) {
    case GROUP_BY.TAGS:
    case GROUP_BY.OPERATIONS:
      return '../';
    case GROUP_BY.ENDPOINTS:
      return '../../';
    default:
      return './';
  }
};

export const findPlugin = (
  config: ApigConfig,
  name: string,
): ApigPlugin | undefined =>
  (config.plugins ?? []).find((p) => p.name === name);

/**
 * Import path to a root-scoped plugin's output file, honouring a custom
 * `fileName` on that plugin.
 * @example getRootPluginImport(config, 'faker', 'root') → './faker'
 */
export const getRootPluginImport = (
  config: ApigConfig,
  name: string,
  scope: FileScope,
): string => {
  const plugin = findPlugin(config, name);
  return `${getRootPrefix(config, scope)}${plugin?.fileName ?? name}`;
};
