import {
  GROUP_BY,
  type ZvyappyConfig,
  type ZvyappyPlugin,
  type IROperation,
} from '@models';
import { applyNaming } from '@libs/string';

/** Where the file doing the import lives — the same value as the plugin's `scope`. */
export type FileScope = 'root' | 'operations';

/**
 * Path prefix from the importing file back to the output root.
 *
 * Root-scoped plugins always write to the output root, so they reach siblings
 * with `./` no matter how the project is grouped. Only operation-scoped files
 * are nested by `groupBy` and have to climb back up.
 */
export const getRootPrefix = (
  config: ZvyappyConfig,
  scope: FileScope,
): string => {
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
  config: ZvyappyConfig,
  name: string,
): ZvyappyPlugin | undefined =>
  (config.plugins ?? []).find((p) => p.name === name);

/**
 * Import path to a root-scoped plugin's output file, honouring a custom
 * `fileName` on that plugin.
 * @example getRootPluginImport(config, 'faker', 'root') → './faker'
 */
export const getRootPluginImport = (
  config: ZvyappyConfig,
  name: string,
  scope: FileScope,
): string => {
  const plugin = findPlugin(config, name);
  return `${getRootPrefix(config, scope)}${plugin?.fileName ?? name}`;
};

/**
 * Import path, from a root-scoped file, to the file an operation-scoped plugin
 * wrote `op` into. Under `groupBy` that file sits in the operation's group
 * directory, named the way `index.ts` re-exports it — there is no root file.
 * @example getOperationPluginImport(config, 'requests', op) → './pets/pets.requests'
 */
export const getOperationPluginImport = (
  config: ZvyappyConfig,
  name: string,
  op: IROperation,
): string => {
  const fileName = findPlugin(config, name)?.fileName ?? name;
  const naming = config.fileNaming ?? 'kebab-case';
  const tagDir = applyNaming(op.tag ?? 'default', naming);
  const opDir = applyNaming(op.id, naming);

  switch (config?.groupBy ?? GROUP_BY.NONE) {
    case GROUP_BY.TAGS:
      return `./${tagDir}/${tagDir}.${fileName}`;
    case GROUP_BY.ENDPOINTS:
      return `./${tagDir}/${opDir}/${opDir}.${fileName}`;
    case GROUP_BY.OPERATIONS:
      return `./${opDir}/${opDir}.${fileName}`;
    default:
      return `./${fileName}`;
  }
};
