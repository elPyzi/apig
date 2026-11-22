import { resolve } from 'path';
import { createJiti } from 'jiti';

/**
 * Loads a `.ts`/`.js` config file's default export, whatever shape it is.
 *
 * Generic on purpose: reading the file off disk is identical for every
 * generator's config, only what the default export means differs — that part
 * belongs to a loader written for that generator's own types.
 */
export const loadModule = async <T>(configPath: string): Promise<T> => {
  const jiti = createJiti(import.meta.url);
  const mod = (await jiti.import(resolve(process.cwd(), configPath))) as {
    default: T;
  };
  return mod.default;
};
