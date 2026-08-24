import type { ApigConfig } from '@models';
import { findPlugin, getRootPrefix, type FileScope } from './get-plugin-import';

type ValidationPlugin = 'zod' | 'valibot' | 'yup';

const VALIDATION_PLUGINS: ValidationPlugin[] = ['zod', 'valibot', 'yup'];

/**
 * Which file actually holds the exported TypeScript types.
 * A validation plugin only owns the types when it emits them (`withTypes !== false`);
 * otherwise `typescript()` stays responsible and types live in `types.ts`.
 */
const getTypesOwner = (config: ApigConfig): string => {
  for (const name of VALIDATION_PLUGINS) {
    const plugin = findPlugin(config, name);
    if (plugin && (plugin.withTypes ?? true)) return plugin.fileName;
  }

  return findPlugin(config, 'typescript')?.fileName ?? 'types';
};

/**
 * @param scope scope of the plugin doing the import — types always live at the
 *              output root, so a root-scoped importer never needs to climb up.
 */
export const getTypesImport = (config: ApigConfig, scope: FileScope): string =>
  `${getRootPrefix(config, scope)}${getTypesOwner(config)}`;
